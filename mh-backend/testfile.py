import pandas as pd, sqlite3, pathlib
df = pd.read_csv("/Users/raaj/Documents/CS/madhelp/mh-frontend/src/pages/Faculty_Research_Info_Final_With_Emails (New).csv")
con = sqlite3.connect("data.db")            # same file your Flask app uses
df.to_sql("faculty", con, if_exists="replace", index=False)
con.close()