import re
import json
from datetime import date

def parse_dars_report(dars_text):
    """
    Parses the DARS report into a structured JSON-like dict, following the pseudocode:
      1) student name & catalog year from line 2
      2) program from last line before first dashed line
      3) completed courses from "TOTAL CREDITS for the DEGREE" section
      4) in_progress_courses vs upcoming_courses from "COURSES currently IN-PROGRESS" section
         (uses term logic & hard-coded start dates)
      5) general_education from lines "OK/NO University GENERAL EDUCATION: ... "
      6) major_requirements from lines "OK/NO <something> major: <something>"
      7) total_credits from the same "TOTAL CREDITS for the DEGREE" block
    """

    # We will store a fixed "today" so we can determine if a semester has started.
    # E.g. the user said: "use the start date for spring semester as Jan 21, fall as Sept 7"
    # We'll assume 'today' = Jan 19, 2025 (just as an example).
    # In real usage, you could use date.today() or a user-supplied date.
    today = date(2025, 1, 19)

    data = {
        "student_info": {
            "student_name": "",
            "catalog_year": "",
            "program": ""
        },
        "completed_courses": [],
        "in_progress_courses": [],
        "upcoming_courses": [],
        "general_education": {},
        "major_requirements": {},
        "total_credits": {
            "earned": 0,
            "needed": 0,
            "in_progress": 0
        }
    }

    # Split the DARS text by lines for simpler line-by-line logic.
    lines = dars_text.splitlines()

    # ---------------------------------------------------------
    # 1) Student name & catalog year from line 2
    # ---------------------------------------------------------
    # The pseudocode says: 
    #   "student name, get from second line from the start 
    #    of the line to before the word 'Catalog'. 
    #    e.g. Janaswamy,Anurag Catalog Year: 20231"
    if len(lines) > 1:
        second_line = lines[1].strip()
        # Split up to " Catalog"
        # example: "Janaswamy,Anurag Catalog Year: 20231"
        if " Catalog" in second_line:
            name_part = second_line.split(" Catalog")[0].strip()
            data["student_info"]["student_name"] = name_part

            # Also parse catalog year from "Year:"
            # e.g. "Janaswamy,Anurag Catalog Year: 20231"
            # We'll do something like: split on "Year:" => second part => strip
            year_index = second_line.find("Year:")
            if year_index != -1:
                after_year = second_line[year_index + len("Year:"):].strip()
                # e.g. "20231"
                data["student_info"]["catalog_year"] = after_year

    # ---------------------------------------------------------
    # 2) Program from last line before the first dashed line
    # ---------------------------------------------------------
    # We find the first line that starts with dashes "----".
    # The line immediately before that is something like "DATA SCIENCE major".
    # We'll parse everything before "major".
    program_line = ""
    for i, ln in enumerate(lines):
        if ln.strip().startswith("---"):  # found the dashed line
            # The line before i
            if i > 0:
                program_line = lines[i - 1].strip()
            break

    if program_line and "major" in program_line:
        # parse everything before the word "major"
        parts = program_line.split("major", 1)
        prog = parts[0].strip()
        data["student_info"]["program"] = prog

    # ---------------------------------------------------------
    # 3) Completed courses from "NO TOTAL CREDITS for the DEGREE" block
    # ---------------------------------------------------------
    # We'll find the block from the line that contains
    # "NO TOTAL CREDITS for the DEGREE" up to the next line of dashes ("-----").
    # Then parse each line matching the pattern:
    #   <Term> <CourseCode> <Credits> <Grade> <CourseName>
    #
    # For courses in this block, if Grade != "INP", we treat as completed.
    block_total_credits = ""
    start_idx = None
    end_idx = None
    for i, ln in enumerate(lines):
        if "NO TOTAL CREDITS for the DEGREE" in ln:
            start_idx = i
            break

    if start_idx is not None:
        # find next dashed line
        for j in range(start_idx + 1, len(lines)):
            if lines[j].strip().startswith("---"):
                end_idx = j
                break
        # if we never find a dashed line, end_idx is the end of the file
        if end_idx is None:
            end_idx = len(lines)
        # capture that block
        block_total_credits = "\n".join(lines[start_idx:end_idx])

    # Now parse the lines in block_total_credits
    # We'll define a regex to capture
    #   ^SP24 ASTRON 103 3.00 A The Evolving Universe
    course_pattern = re.compile(
        r"^([A-Z]{2}\d{2})\s+(.+?)\s+(\d+\.\d+)\s+(\S+)\s+(.*)$"
    )

    # Also parse total credits (EARNED, IN-PROGRESS, NEEDS) from this block
    # e.g. 
    #   EARNED: 80.00 CREDITS
    #   IN-PROGRESS 15.00 CREDITS
    #   --> NEEDS: 25.00 CREDITS
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
            # if grade != INP, consider it completed
            if grade.upper() != "INP":
                data["completed_courses"].append({
                    "term": term,
                    "course_code": course_code,
                    "credits": credits,
                    "grade": grade,
                    "course_name": course_name
                })

    # ---------------------------------------------------------
    # 4) In-progress vs. Upcoming from "COURSES currently IN-PROGRESS" section
    # ---------------------------------------------------------
    # We do the same approach: find the block after 
    # "COURSES currently IN-PROGRESS" until the next dashed line.
    block_inprogress = ""
    start_idx = None
    end_idx = None
    for i, ln in enumerate(lines):
        if "COURSES currently IN-PROGRESS" in ln:
            start_idx = i
            break

    if start_idx is not None:
        # find next dashed line
        for j in range(start_idx + 1, len(lines)):
            if lines[j].strip().startswith("---"):
                end_idx = j
                break
        if end_idx is None:
            end_idx = len(lines)
        block_inprogress = "\n".join(lines[start_idx:end_idx])

    # parse lines in block_inprogress
    #   SP25 BIOCHEM 104 3.00 INP Molecules to Life & Science
    #   => If it's spring 2025, we compare "today" (2025-01-19) to start date (Jan 21, 2025).
    #   => If today < Jan21 => upcoming, else in_progress
    def term_to_start_date(term_code):
        """
        Convert a term code like SP25 or FA24 into a date 
        for the official 'start of term' we use to decide 
        if it's in progress or upcoming.
        """
        # example: SP25 => Spring 2025 => start date is Jan 21, 2025
        #          FA24 => Fall 2024 => start date is Sept 7, 2024
        # We'll parse the last 2 digits for year 
        # (Note: This is naive for 2100+ usage, but fits the example.)
        year_part = int("20" + term_code[2:])  # e.g. SP25 => "25" => int("2025")
        semester_part = term_code[:2]  # "SP" or "FA" etc.

        if semester_part == "SP":
            return date(year_part, 1, 21)  # Jan 21
        elif semester_part == "FA":
            return date(year_part, 9, 7)   # Sep 7
        # If other terms exist (SU, WI), define them as needed:
        elif semester_part == "SU":
            # let's say summer starts June 1
            return date(year_part, 6, 1)
        else:
            # default fallback
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
            # user says: "keep grade as '-' when it says INP"
            if grade.upper() == "INP":
                grade = "-"

            # decide upcoming vs in_progress
            start_of_term = term_to_start_date(term)
            if today < start_of_term:
                # hasn't started
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

    # ---------------------------------------------------------
    # 5) general_education
    # ---------------------------------------------------------
    # The format:
    #   OK University GENERAL EDUCATION: Breadth
    #   + 1) Natural Science - 6 credits ...
    #   [lines with courses, lines with NEEDS or SELECT FROM]
    #
    # We'll capture each top-level block from "OK/NO University GENERAL EDUCATION: X"
    # until the next "OK/NO University GENERAL EDUCATION:" or dashed line or end.
    gened_main_pat = re.compile(r"^(OK|NO)\s+University\s+GENERAL\s+EDUCATION:\s+(.*)$", re.MULTILINE)
    subreq_pat = re.compile(r"^([\+\-])\s+(\d?\)?)?\s*(.*)$", re.MULTILINE)

    # We'll transform lines into a single string to do block-based matching
    dars_joined = "\n".join(lines)

    gened_blocks = list(gened_main_pat.finditer(dars_joined))
    for i, match_g in enumerate(gened_blocks):
        status = match_g.group(1)  # OK or NO
        gened_name = match_g.group(2).strip()

        # find block text from the end of this match to either:
        #   - start of next gen-ed match
        #   - or next dashed line
        startpos = match_g.end()
        if i < len(gened_blocks) - 1:
            endpos = gened_blocks[i+1].start()
        else:
            # search for next dashed line or end
            next_dash = dars_joined.find("---", startpos)
            if next_dash == -1:
                endpos = len(dars_joined)
            else:
                endpos = next_dash

        block_text = dars_joined[startpos:endpos]

        data["general_education"][gened_name] = {
            "status": status,
            "subsections": {}
        }

        # Now parse subrequirements from lines that start with + or -
        subs = list(subreq_pat.finditer(block_text))
        for j, sr in enumerate(subs):
            sub_name_raw = sr.group(3).strip()
            # e.g. "1) Natural Science - 6 credits..."
            # remove leading "1)" or "2)"
            sub_name_clean = re.sub(r"^\d+\)\s*", "", sub_name_raw)

            data["general_education"][gened_name]["subsections"][sub_name_clean] = {
                "completed_courses": [],
                "required_courses": []
            }

            # find the text chunk for this subreq
            sr_start = sr.end()
            if j < len(subs) - 1:
                sr_end = subs[j+1].start()
            else:
                sr_end = len(block_text)
            sub_block = block_text[sr_start:sr_end]

            # parse lines for "NEEDS:" or "SELECT FROM:"
            for line_sub in sub_block.splitlines():
                ls = line_sub.strip()
                if ls.startswith("NEEDS:") or ls.startswith("SELECT FROM:"):
                    data["general_education"][gened_name]["subsections"][sub_name_clean]["required_courses"].append(ls)

            # parse any course lines in this sub-block as completed courses for that sub-subfield
            # i.e. if Grade != INP. We'll do the same pattern we used:
            for line_sub in sub_block.splitlines():
                line_sub = line_sub.strip()
                cm = course_pattern.match(line_sub)
                if cm:
                    grade_here = cm.group(4).upper()
                    if grade_here != "INP":  # only completed
                        data["general_education"][gened_name]["subsections"][sub_name_clean]["completed_courses"].append(
                            cm.group(2)  # or store a full object
                        )

    # ---------------------------------------------------------
    # 6) major_requirements
    # ---------------------------------------------------------
    # We'll look for lines: "OK <something> major: <something>" or "NO <something> major: <something>"
    major_pat = re.compile(r"^(OK|NO)\s+(.*?)\s+major:\s+(.*)$", re.MULTILINE)
    # Then parse sub-block similarly.
    major_blocks = list(major_pat.finditer(dars_joined))
    for i, mm in enumerate(major_blocks):
        status = mm.group(1)  # OK or NO
        # e.g. "DATA SCIENCE"
        major_label = mm.group(2).strip()
        # e.g. "Foundational Math Courses"
        major_section_name = mm.group(3).strip()
        # We'll combine them or keep them separate; for clarity, let's just store
        # the major_section_name as the key
        startpos = mm.end()
        if i < len(major_blocks) - 1:
            endpos = major_blocks[i+1].start()
        else:
            next_dash = dars_joined.find("---", startpos)
            endpos = len(dars_joined) if next_dash == -1 else next_dash

        block_text = dars_joined[startpos:endpos]

        data["major_requirements"][major_section_name] = {
            "status": status,
            "subsections": {}
        }

        # subreq pattern is still lines starting + or -
        subreqs_maj = list(subreq_pat.finditer(block_text))
        for j, sr in enumerate(subreqs_maj):
            sub_name_raw = sr.group(3).strip()
            sub_name_clean = re.sub(r"^\d+\)\s*", "", sub_name_raw)

            data["major_requirements"][major_section_name]["subsections"][sub_name_clean] = {
                "completed_courses": [],
                "required_courses": []
            }

            sr_start = sr.end()
            if j < len(subreqs_maj) - 1:
                sr_end = subreqs_maj[j+1].start()
            else:
                sr_end = len(block_text)
            sub_block = block_text[sr_start:sr_end]

            # parse NEEDS/SELECT FROM
            for line_sub in sub_block.splitlines():
                ls = line_sub.strip()
                if ls.startswith("NEEDS:") or ls.startswith("SELECT FROM:"):
                    # e.g. "NEEDS: 1 COURSE\nSELECT FROM: L I S 461 OR E C E 570"
                    data["major_requirements"][major_section_name]["subsections"][sub_name_clean]["required_courses"].append(ls)

            # parse completed courses in sub-block
            for line_sub in sub_block.splitlines():
                line_sub = line_sub.strip()
                cm = course_pattern.match(line_sub)
                if cm:
                    grade_here = cm.group(4).upper()
                    if grade_here != "INP":
                        data["major_requirements"][major_section_name]["subsections"][sub_name_clean]["completed_courses"].append(
                            cm.group(2)
                        )

    return data


if __name__ == "__main__":
    with open("dars_report_final_check.txt", "r", encoding="utf-8") as file:
        text = file.read()
    parsed = parse_dars_report(text)

    output_file = "final_dars_check.json"
    with open(output_file, "w", encoding="utf-8") as json_file:
        json.dump(parsed, json_file, indent=4)
    print(f"Data saved to {output_file}")
    