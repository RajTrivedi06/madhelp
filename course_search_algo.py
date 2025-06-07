import re
import json
import csv
from datetime import date
import openai
import numpy as np
import requests
import networkx as nx
from itertools import product
import matplotlib.pyplot as plt
import pdfplumber

# ----------- Boolean Expression Tree Classes -----------
class Node:
    def generate_sequences(self):
        raise NotImplementedError("Subclasses must implement generate_sequences.")

class AndNode(Node):
    def __init__(self, children):
        self.children = children

    def __str__(self):
        return "(" + " AND ".join(str(child) for child in self.children) + ")"

    def generate_sequences(self):
        child_seq = [child.generate_sequences() for child in self.children]
        sequences = [sum(seq_tuple, []) for seq_tuple in product(*child_seq)]
        return sequences

class OrNode(Node):
    def __init__(self, children):
        self.children = children

    def __str__(self):
        return "(" + " OR ".join(str(child) for child in self.children) + ")"

    def generate_sequences(self):
        sequences = []
        for child in self.children:
            sequences.extend(child.generate_sequences())
        return sequences

class LeafNode(Node):
    def __init__(self, value):
        self.value = value.strip()

    def __str__(self):
        return self.value

    def generate_sequences(self):
        return [[self.value]]

class PreReqParser:
    """
    A recursive descent parser for prerequisites.
    It converts commas to 'or', tokenizes on parentheses and the words "and"/"or",
    and then builds the boolean expression tree.
    """
    def __init__(self, input_str):
        self.input_str = re.sub(r",", " or ", input_str)
        self.tokens = self.tokenize(self.input_str)
        self.index = 0

    def tokenize(self, text):
        pattern = r"(\(|\)|\s+and\s+|\s+or\s+)"
        tokens = [token.strip() for token in re.split(pattern, text, flags=re.IGNORECASE) if token.strip()]
        return tokens

    def current_token(self):
        if self.index < len(self.tokens):
            return self.tokens[self.index]
        return None

    def consume_token(self, expected=None):
        token = self.current_token()
        if expected and token.lower() != expected.lower():
            raise Exception(f"Expected token '{expected}', got '{token}'")
        self.index += 1
        return token

    def parse(self):
        return self.parse_and()

    def parse_and(self):
        nodes = [self.parse_or()]
        while self.current_token() and self.current_token().lower() == "and":
            self.consume_token("and")
            nodes.append(self.parse_or())
        if len(nodes) == 1:
            return nodes[0]
        return AndNode(nodes)

    def parse_or(self):
        nodes = [self.parse_primary()]
        while self.current_token() and self.current_token().lower() == "or":
            self.consume_token("or")
            nodes.append(self.parse_primary())
        if len(nodes) == 1:
            return nodes[0]
        return OrNode(nodes)

    def parse_primary(self):
        token = self.current_token()
        if token == "(":
            self.consume_token("(")
            node = self.parse_and()
            self.consume_token(")")
            return node
        else:
            self.consume_token()
            return LeafNode(token)

# ------------------ CourseSearchHelper Class ------------------
class CourseSearchHelper:
    def __init__(self, openai_api_key, weaviate_url="http://localhost:8080/v1", courses_csv_path=None):
        print("🔧 Initializing CourseSearchHelper...")
        self.openai_api_key = openai_api_key
        self.weaviate_url = weaviate_url
        openai.api_key = self.openai_api_key
        if courses_csv_path:
            self.course_prereq_dict = self.load_courses_csv(courses_csv_path)
        else:
            self.course_prereq_dict = {}

    def convert_dars_pdf_to_text(self, pdf_path, output_txt_path):
        text_output = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_output.append(page_text)
        with open(output_txt_path, "w", encoding="utf-8") as file:
            file.write("\n".join(text_output))
        print(f"✅ Successfully converted {pdf_path} to {output_txt_path}")

    def load_courses_csv(self, csv_path):
        course_dict = {}
        with open(csv_path, mode="r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                course_title = row["Course Title"].strip()
                code_part = course_title.split("—")[0].strip()
                norm_code = self.normalize_course_code(code_part)
                requisites = row["Requisites"].strip() if "Requisites" in row else ""
                course_dict[norm_code] = {
                    "title": course_title,
                    "credits": row["Credits"].strip(),
                    "description": row["Description"].strip(),
                    "requisites": requisites,
                    "learning_outcomes": row.get("Learning Outcomes", "").strip(),
                    "repeatable": row.get("Repeatable for Credit", "").strip(),
                    "last_taught": row.get("Last Taught", "").strip(),
                    "designation": row.get("Course Designation", "").strip()
                }
        print(f"✅ Loaded {len(course_dict)} courses from CSV.")
        return course_dict

    def extract_course_codes(self, text):
        """Return a set of course codes extracted from arbitrary text."""
        pattern = r"\b(?!OR\b|AND\b)(?:[A-Za-z]+(?:\s+[A-Za-z]+)*(?:/[A-Za-z]+(?:\s+[A-Za-z]+)*)*)\s*\d+[A-Za-z]?"
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        return {m.strip() for m in matches}

    def extract_required_courses_from_dars(self, dars_data):
        req_set = set()
        if "major_requirements" in dars_data:
            for major, info in dars_data["major_requirements"].items():
                if "subsections" in info:
                    for sub, subdata in info["subsections"].items():
                        for req_text in subdata.get("required_courses", []):
                            codes = self.extract_course_codes(req_text)
                            req_set.update(codes)
        return req_set

    def parse_dars_report(self, dars_text):
        if isinstance(dars_text, dict):
            return dars_text
        today = date(2025, 1, 19)
        data = {
            "student_info": {"student_name": "", "catalog_year": "", "program": ""},
            "completed_courses": [],
            "in_progress_courses": [],
            "upcoming_courses": [],
            "general_education": {},
            "major_requirements": {},
            "total_credits": {"earned": 0, "needed": 0, "in_progress": 0}
        }
        lines = dars_text.splitlines()
        if len(lines) > 1:
            second_line = lines[1].strip()
            if " Catalog" in second_line:
                name_part = second_line.split(" Catalog")[0].strip()
                data["student_info"]["student_name"] = name_part
                year_index = second_line.find("Year:")
                if year_index != -1:
                    after_year = second_line[year_index + len("Year:"):].strip()
                    data["student_info"]["catalog_year"] = after_year
        program_line = ""
        for i, ln in enumerate(lines):
            if ln.strip().startswith("---"):
                if i > 0:
                    program_line = lines[i - 1].strip()
                break
        if program_line and "major" in program_line:
            parts = program_line.split("major", 1)
            data["student_info"]["program"] = parts[0].strip()
        block_total_credits = ""
        start_idx = None
        end_idx = None
        for i, ln in enumerate(lines):
            if "NO TOTAL CREDITS for the DEGREE" in ln:
                start_idx = i
                break
        if start_idx is not None:
            for j in range(start_idx + 1, len(lines)):
                if lines[j].strip().startswith("---"):
                    end_idx = j
                    break
            if end_idx is None:
                end_idx = len(lines)
            block_total_credits = "\n".join(lines[start_idx:end_idx])
        course_pattern = re.compile(r"^([A-Z]{2}\d{2})\s+(.+?)\s+(\d+\.\d+)\s+(\S+)\s+(.*)$")
        m_earned = re.search(r"EARNED:\s*([\d\.]+)\s*CREDITS", block_total_credits)
        if m_earned:
            data["total_credits"]["earned"] = int(float(m_earned.group(1)))
        m_inprog = re.search(r"IN-PROGRESS\s+([\d\.]+)\s*CREDITS", block_total_credits)
        if m_inprog:
            data["total_credits"]["in_progress"] = int(float(m_inprog.group(1)))
        m_needed = re.search(r"NEEDS:\s*([\d\.]+)\s*CREDITS", block_total_credits)
        if m_needed:
            data["total_credits"]["needed"] = int(float(m_needed.group(1)))
        for line_text in block_total_credits.splitlines():
            line_text = line_text.strip()
            cmatch = course_pattern.match(line_text)
            if cmatch:
                term = cmatch.group(1)
                course_code = cmatch.group(2)
                credits = float(cmatch.group(3))
                grade = cmatch.group(4)
                course_name = cmatch.group(5)
                if grade.upper() != "INP":
                    data["completed_courses"].append({
                        "term": term,
                        "course_code": course_code,
                        "credits": credits,
                        "grade": grade,
                        "course_name": course_name
                    })
        block_inprogress = ""
        start_idx = None
        end_idx = None
        for i, ln in enumerate(lines):
            if "COURSES currently IN-PROGRESS" in ln:
                start_idx = i
                break
        if start_idx is not None:
            for j in range(start_idx + 1, len(lines)):
                if lines[j].strip().startswith("---"):
                    end_idx = j
                    break
            if end_idx is None:
                end_idx = len(lines)
            block_inprogress = "\n".join(lines[start_idx:end_idx])
        def term_to_start_date(term_code):
            year_part = int("20" + term_code[2:])
            semester_part = term_code[:2]
            if semester_part == "SP":
                return date(year_part, 1, 21)
            elif semester_part == "FA":
                return date(year_part, 9, 7)
            elif semester_part == "SU":
                return date(year_part, 6, 1)
            else:
                return date(year_part, 1, 1)
        for line_text in block_inprogress.splitlines():
            line_text = line_text.strip()
            cmatch = course_pattern.match(line_text)
            if cmatch:
                term = cmatch.group(1)
                course_code = cmatch.group(2)
                credits = float(cmatch.group(3))
                grade = cmatch.group(4)
                course_name = cmatch.group(5)
                if grade.upper() == "INP":
                    grade = "-"
                start_of_term = term_to_start_date(term)
                if today < start_of_term:
                    data["upcoming_courses"].append({
                        "term": term,
                        "course_code": course_code,
                        "credits": credits,
                        "grade": grade,
                        "course_name": course_name
                    })
                else:
                    data["in_progress_courses"].append({
                        "term": term,
                        "course_code": course_code,
                        "credits": credits,
                        "grade": grade,
                        "course_name": course_name
                    })
        return data

    def generate_embedding(self, text):
        print(f"🧠 Generating embedding for: {text[:50]}...")
        response = openai.embeddings.create(input=[text], model="text-embedding-3-large")
        return response.data[0].embedding

    def parse_multiple_dars_reports(self, dars_reports):
        print(f"📄 Parsing {len(dars_reports)} DARS reports...")
        completed_courses = set()
        for dars_json in dars_reports:
            parsed_data = self.parse_dars_report(dars_json)
            for course in parsed_data.get("completed_courses", []):
                completed_courses.add(self.normalize_course_code(course["course_code"]))
        required_from_dars = set()
        for dars_json in dars_reports:
            parsed_data = self.parse_dars_report(dars_json)
            required_from_dars.update(self.extract_required_courses_from_dars(parsed_data))
        print(f"✔ Aggregated courses: Completed: {len(completed_courses)}, Required: {len(required_from_dars)}")
        return {"completed": completed_courses, "required": required_from_dars}

    def extract_required_courses_from_dars(self, dars_data):
        req_set = set()
        if "major_requirements" in dars_data:
            for major, info in dars_data["major_requirements"].items():
                if "subsections" in info:
                    for sub, subdata in info["subsections"].items():
                        for req_text in subdata.get("required_courses", []):
                            codes = self.extract_course_codes(req_text)
                            req_set.update(codes)
        return req_set

    def extract_course_codes(self, text):
        """Return a set of course codes extracted from arbitrary text."""
        pattern = r"\b(?!OR\b|AND\b)(?:[A-Za-z]+(?:\s+[A-Za-z]+)*(?:/[A-Za-z]+(?:\s+[A-Za-z]+)*)*)\s*\d+[A-Za-z]?"
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        return {match.strip() for match in matches}

    def generate_required_course_embeddings(self, required_courses):
        print(f"🔎 Generating embeddings for {len(required_courses)} required courses...")
        return [self.generate_embedding(course) for course in required_courses]

    def compute_combined_embedding(self, dars_embeddings, interest_embedding, required_embeddings):
        print("🧬 Computing combined embedding...")
        all_embeddings = dars_embeddings + [interest_embedding] + required_embeddings
        combined_vector = np.mean(all_embeddings, axis=0).tolist()
        return combined_vector

    def search_recommended_courses(self, combined_embedding, top_k=10):
        print(f"🔍 Querying Weaviate for course recommendations... (top_k={top_k})")
        url = f"{self.weaviate_url}/graphql"
        payload = {
            "query": """
            {
              Get {
                UWCourse(
                  nearVector: { vector: %s }
                  limit: %d
                ) {
                  courseTitle
                  oneLinerDescription
                }
              }
            }
            """ % (json.dumps(combined_embedding), top_k)
        }
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            results = response.json().get("data", {}).get("Get", {}).get("UWCourse", [])
            print(f"✔ Weaviate returned {len(results)} results.")
            return results
        else:
            print(f"❌ Weaviate query failed: {response.text}")
            return None

    def normalize_course_code(self, course_title):
        # Helper function to insert space before the course number if missing
        def insert_space_before_number(code):
            # Find the last sequence of digits (the course number)
            match = re.search(r'\d+$', code)
            if match:
                number = match.group()  # e.g., "200"
                dept = code[:match.start()].strip()  # e.g., "COMP SCI"
                return dept + " " + number  # e.g., "COMP SCI 200"
            return code  # Return unchanged if no digits found

        # Replace non-breaking spaces with regular spaces and strip extra spaces
        code = course_title.replace("\xa0", " ").strip()
        # Insert space before the course number if missing
        code = insert_space_before_number(code)
        # Convert to uppercase and return
        return code.upper()

    def is_only_grad_standing(self, req_text):
        lower_req = req_text.lower().strip()
        return lower_req == "graduate/professional standing"

    def recommend_courses(self, dars_reports, interest_text, top_k=10):
        print("🚀 Running course recommendation system...")
        parsed_dars = self.parse_multiple_dars_reports(dars_reports)
        required_courses = parsed_dars["required"]

        dars_embeddings = [self.generate_embedding(json.dumps(dars_json)) for dars_json in dars_reports]
        interest_embedding = self.generate_embedding(interest_text)
        required_embeddings = self.generate_required_course_embeddings(required_courses)
        combined_embedding = self.compute_combined_embedding(dars_embeddings, interest_embedding, required_embeddings)
        recommended_courses = self.search_recommended_courses(combined_embedding, top_k)
        if recommended_courses is None:
            print("⚠ No courses retrieved.")
            return []
        completed_set = parsed_dars["completed"]
        print(parsed_dars)
        filtered = []
        for course in recommended_courses:
            norm_code = self.normalize_course_code(course["courseTitle"].split("—")[0].strip())
            if norm_code in completed_set:
                print(f"Skipping {norm_code} because it's already completed.")
                continue
            if required_courses and norm_code not in required_courses:
                print(f"Skipping {norm_code} because it is not in required courses.")
                continue
            if norm_code in self.course_prereq_dict:
                req_text = self.course_prereq_dict[norm_code]["requisites"]
                if self.is_only_grad_standing(req_text):
                    print(f"Skipping {norm_code} because its prerequisite is only graduate/professional standing.")
                    continue
            filtered.append(course)
        if len(filtered) < 3:
            print("⚠ Less than 3 courses remain after filtering. Re-running with top_k=25.")
            recommended_courses_2 = self.search_recommended_courses(
                self.compute_combined_embedding(
                    [self.generate_embedding(json.dumps(r)) for r in dars_reports],
                    self.generate_embedding(interest_text),
                    self.generate_required_course_embeddings(required_courses)
                ), top_k=25)
            if not recommended_courses_2:
                return []
            filtered2 = []
            for course in recommended_courses_2:
                norm_code = self.normalize_course_code(course["courseTitle"].split("—")[0].strip())
                if norm_code in completed_set:
                    continue
                if required_courses and norm_code not in required_courses:
                    continue
                filtered2.append(course)
            filtered = filtered2
        print("\n✅ Final Recommended Courses:")
        for item in filtered:
            print(f"🔹 {item['courseTitle']}")
        return filtered

    # --- Modified optimal_prereq_path: Immediate prerequisites only (no recursion) ---
    def optimal_prereq_path(self, course_code, completed, memo=None, visited=None):
        print(f"[Modified] Computing immediate prerequisite path for {course_code}.")
        # If already completed or no requisites provided, simply return the course itself
        if course_code in completed or course_code not in self.course_prereq_dict or not self.course_prereq_dict[course_code]["requisites"].strip() or self.is_only_grad_standing(self.course_prereq_dict[course_code]["requisites"]):
            return (0, [course_code])
        prereq_text = self.course_prereq_dict[course_code]["requisites"].strip()
        try:
            parser = PreReqParser(prereq_text)
            tree = parser.parse()
            sequences = tree.generate_sequences()
            # Choose the first sequence (i.e. immediate prerequisites without recursing further)
            best_seq = sequences[0] if sequences else []
            cost = len(best_seq)
            # Append the target course at the end of the sequence
            best_seq.append(course_code)
            return (cost, best_seq)
        except Exception as e:
            print(f"Error parsing prerequisites for {course_code}: {e}")
            return (float('inf'), [course_code])

    def visualize_sequences_linear(self, sequences, target_course):
        num_seq = len(sequences)
        cols = 2
        rows = (num_seq + 1) // cols
        fig, axes = plt.subplots(rows, cols, figsize=(cols * 6, rows * 3))
        if rows == 1:
            axes = [axes]
        axes = [ax for sub in axes for ax in (sub if hasattr(sub, '__iter__') else [sub])]
        for idx, seq in enumerate(sequences, start=1):
            full_seq = seq + [target_course]
            G = nx.DiGraph()
            for i in range(len(full_seq) - 1):
                G.add_edge(full_seq[i], full_seq[i+1])
            pos = {node: (i, 0) for i, node in enumerate(full_seq)}
            ax = axes[idx - 1]
            ax.set_title(f"Option {idx}")
            nx.draw_networkx_nodes(G, pos, node_color="skyblue", node_size=1500, ax=ax)
            nx.draw_networkx_edges(G, pos, arrowstyle="-|>", arrowsize=20, ax=ax)
            nx.draw_networkx_labels(G, pos, font_size=10, font_weight="bold", ax=ax)
            ax.axis("off")
        for i in range(idx, len(axes)):
            axes[i].axis("off")
        plt.tight_layout()
        plt.show()

    # --- PreRequisite Parser (Inner Classes) ---
    class NodeBase:
        def generate_sequences(self):
            raise NotImplementedError("Subclasses must implement generate_sequences.")

    class AndNode(NodeBase):
        def __init__(self, children):
            self.children = children

        def __str__(self):
            return "(" + " AND ".join(str(child) for child in self.children) + ")"

        def generate_sequences(self):
            child_seq = [child.generate_sequences() for child in self.children]
            return [sum(seq_tuple, []) for seq_tuple in product(*child_seq)]

    class OrNode(NodeBase):
        def __init__(self, children):
            self.children = children

        def __str__(self):
            return "(" + " OR ".join(str(child) for child in self.children) + ")"

        def generate_sequences(self):
            sequences = []
            for child in self.children:
                sequences.extend(child.generate_sequences())
            return sequences

    class LeafNode(NodeBase):
        def __init__(self, value):
            self.value = value.strip()

        def __str__(self):
            return self.value

        def generate_sequences(self):
            return [[self.value]]

    class PreReqParser:
        def __init__(self, input_str):
            self.input_str = re.sub(r",", " or ", input_str)
            self.tokens = self.tokenize(self.input_str)
            self.current = 0

        def tokenize(self, text):
            pattern = r"(\(|\)|\s+and\s+|\s+or\s+)"
            raw_tokens = re.split(pattern, text, flags=re.IGNORECASE)
            tokens = []
            for token in raw_tokens:
                token = token.strip()
                if token:
                    lower = token.lower()
                    if lower in ("and", "or", "(", ")"):
                        tokens.append(lower)
                    else:
                        tokens.append(token)
            return tokens

        def current_token(self):
            if self.current < len(self.tokens):
                return self.tokens[self.current]
            return None

        def consume_token(self, token=None):
            current = self.current_token()
            if token is not None and current != token:
                raise Exception(f"Expected token '{token}', but got '{current}'")
            self.current += 1
            return current

        def parse(self):
            return self.parse_and()

        def parse_and(self):
            nodes = [self.parse_or()]
            while True:
                token = self.current_token()
                if token == "and":
                    self.consume_token("and")
                    nodes.append(self.parse_or())
                else:
                    break
            if len(nodes) == 1:
                return nodes[0]
            return CourseSearchHelper.AndNode(nodes)

        def parse_or(self):
            nodes = [self.parse_primary()]
            while True:
                token = self.current_token()
                if token == "or":
                    self.consume_token("or")
                    nodes.append(self.parse_primary())
                else:
                    break
            if len(nodes) == 1:
                return nodes[0]
            return CourseSearchHelper.OrNode(nodes)

        def parse_primary(self):
            token = self.current_token()
            if token == "(":
                self.consume_token("(")
                node = self.parse_and()
                self.consume_token(")")
                return node
            else:
                self.consume_token()
                return CourseSearchHelper.LeafNode(token)

if __name__ == "__main__":
    helper = CourseSearchHelper(
        openai_api_key="",  # Replace with your actual API key.
        courses_csv_path="courses_output.csv"   # Ensure this CSV exists and is formatted.
    )

    dars_pdf_path = "ajanaswamy-DARSAUDIT-327189157-8903aa32-4747-439f-ab86-2d45b1095683.pdf"
    dars_txt_path = "dars_report_final_check.txt"
    interest_text = "I am interested in AI and machine learning"

    # run_full_pipeline is defined as a method inside CourseSearchHelper.
    def run_full_pipeline_override(helper_obj, dars_pdf_path, courses_csv_path, interest_text, dars_output_txt_path, top_k):
        """
        A simplified version of run_full_pipeline that filters, then computes the optimal prerequisite path 
        (using optimal_prereq_path) for each recommended course.
        """
        helper_obj.convert_dars_pdf_to_text(dars_pdf_path, dars_output_txt_path)
        with open(dars_output_txt_path, "r", encoding="utf-8") as f:
            dars_text = f.read()
        dars_data = helper_obj.parse_dars_report(dars_text)
        dars_reports = [dars_data]
        req_from_dars = helper_obj.extract_required_courses_from_dars(dars_data)
        print(f"Required courses from DARS major requirements: {req_from_dars}")
        recommended_courses = helper_obj.recommend_courses(dars_reports, interest_text, top_k)
        # Build the set of completed courses.
        completed = {helper_obj.normalize_course_code(c["course_code"]) for c in dars_data.get("completed_courses", [])}
        print("\nOptimal Prerequisite Paths:")
        for course in recommended_courses:
            course_title = course["courseTitle"].strip()
            norm_code = helper_obj.normalize_course_code(course_title.split("—")[0].strip())
            if norm_code in helper_obj.course_prereq_dict:
                print(f"\n--- Immediate Prerequisite Path for {course_title} ---")
                cost, path = helper_obj.optimal_prereq_path(norm_code, completed)
                final_path = [p for p in path if p not in completed]
                print(f"Additional immediate prerequisites needed (total cost {cost}): {final_path if final_path else 'None'}")
            else:
                print(f"\nNo prerequisite information available for {course_title}.")
    # Call the override function.
    run_full_pipeline_override(helper, dars_pdf_path, "courses_output.csv", interest_text, dars_txt_path, top_k=15)
