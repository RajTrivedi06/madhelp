import pandas as pd
import numpy as np
import sqlite3
import json
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity

class ResearchMatcher:
    def __init__(self, csv_path, openai_api_key="YOUR_OPENAI_API_KEY"):
        """Initialize the matcher with faculty data and OpenAI API."""
        print("🔧 Initializing ResearchMatcher...")
        self.csv_path = csv_path
        self.client = OpenAI(api_key=openai_api_key)
        self.conn = sqlite3.connect(':memory:')  # In-memory database
        self.professor_embeddings = []
        self.professor_names = []
        self._load_data()
        self._generate_embeddings()

    def _load_data(self):
        """Loads faculty research data from CSV into memory."""
        df = pd.read_csv(self.csv_path, quotechar='"', escapechar='\\')
        df.to_sql('faculty', self.conn, index=False, if_exists='replace')
        
        # Prepare text for embeddings
        self.combined_texts = [
            f"{row['Summary of Research']}. Fields: {row['Fields of Research']}"
            for _, row in df.iterrows()
        ]
        self.professor_names = df['Name'].tolist()

    def _generate_embeddings(self):
        """Generate embeddings for all faculty research descriptions."""
        print("🧠 Generating faculty embeddings...")
        response = self.client.embeddings.create(
            input=self.combined_texts,
            model="text-embedding-ada-002"
        )
        self.professor_embeddings = [np.array(e.embedding) for e in response.data]

    def _get_embedding(self, text):
        """Generate embedding for a given text input."""
        response = self.client.embeddings.create(
            input=[text],
            model="text-embedding-ada-002"
        )
        return np.array(response.data[0].embedding)

    def _parse_multiple_dars_reports(self, dars_list):
        """
        Extracts completed and required courses from multiple DARS JSON reports.
        Ensures unique courses across multiple reports.
        """
        print("📄 Parsing multiple DARS reports...")
        completed_courses = set()
        required_courses = set()

        for dars_json in dars_list:
            # Add completed courses
            completed_courses.update(course["course_code"] for course in dars_json.get("completed_courses", []))

            # Add required courses from each major section
            major_reqs = dars_json.get("major_requirements", {})
            for category, details in major_reqs.items():
                if isinstance(details, dict) and "subsections" in details:
                    for subsection, sub_details in details["subsections"].items():
                        for course in sub_details.get("required_courses", []):
                            required_courses.add(course)

        # Filter placeholders like "SELECT FROM" or "NEEDS"
        required_courses = {course for course in required_courses if not course.startswith("SELECT FROM") and "NEEDS" not in course}

        print(f"✔ Extracted {len(completed_courses)} unique completed and {len(required_courses)} required courses from multiple DARS.")
        return {
            "completed": completed_courses,
            "required": required_courses
        }

    def _get_combined_embedding(self, dars_data, cv_text):
        """Generates a combined embedding using CV + DARS course information."""
        completed_courses = ', '.join(dars_data.get("completed", []))
        required_courses = ', '.join(dars_data.get("required", []))

        combined_text = (
            f"{cv_text}\n\n"
            f"Relevant Completed Courses: {completed_courses}\n"
            f"Required Future Courses: {required_courses}"
        )

        print("🔍 Generating embedding for CV + DARS courses...")
        return self._get_embedding(combined_text)

    def get_matches(self, dars_list, cv_text, top_n=5):
        """Find top matches based on multiple DARS reports + CV using cosine similarity."""
        print("🚀 Running professor matching system with multiple DARS reports...")

        # Merge multiple DARS reports
        parsed_dars = self._parse_multiple_dars_reports(dars_list)

        # Generate a combined embedding
        combined_embedding = self._get_combined_embedding(parsed_dars, cv_text)

        # Compute cosine similarities
        similarities = [
            cosine_similarity([combined_embedding], [prof_emb])[0][0]
            for prof_emb in self.professor_embeddings
        ]

        # Sort indices based on similarity score
        sorted_indices = sorted(
            range(len(similarities)),
            key=lambda i: similarities[i],
            reverse=True
        )

        # Retrieve matching professors from the SQLite database
        cursor = self.conn.cursor()
        results = []

        for idx in sorted_indices[:top_n]:
            cursor.execute(
                'SELECT Name, Faculty, "Summary of Research", "Fields of Research", Email, "Link to Page" '
                'FROM faculty WHERE Name=?',
                (self.professor_names[idx],)
            )
            result = cursor.fetchone()
            results.append({
                'name': result[0],
                'faculty': result[1],
                'summary': result[2],
                'fields': result[3],
                'score': similarities[idx],
                'email': result[4],
                'link': result[5]
            })

        print("✅ Matching complete.")
        return results

# === Example Usage ===
if __name__ == "__main__":
    csv_path = r"C://Users//anura//Downloads//Faculty_Research_Info_Final_With_Emails.csv"
    matcher = ResearchMatcher(csv_path, openai_api_key="")

    # Load multiple DARS JSON files
    dars_files = ["parsed_dars_1.json", "parsed_dars_2.json"]
    dars_data_list = []
    
    for file in dars_files:
        with open(file, "r") as f:
            dars_data_list.append(json.load(f))

    # Sample user interests
    test_cv = """Machine learning researcher with expertise in:
       - Natural language processing
       - Deep learning architectures
       - Statistical modeling
       - Python programming
       - Published papers in AI conferences"""

    # Run the recommendation system
    matches = matcher.get_matches(dars_data_list, test_cv, top_n=10)

    print("\n🔬 Top Matching Professors:\n")
    for match in matches:
        print(f"🔹 {match['name']} (Score: {match['score']:.2f})")
        print(f"Faculty: {match['faculty']}")
        print(f"Research Summary: {match['summary']}...")
        print(f"Fields: {match['fields']}")
        print(f"Contact: {match['email']}")
        print(f"Profile: {match['link']}")
        print("-" * 80)
