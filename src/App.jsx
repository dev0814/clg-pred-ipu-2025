import React, { useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [clicked, setClicked] = useState(false);

  const [username, setUsername] = useState("");
  const [rank, setRank] = useState("");
  const [category, setCategory] = useState("");
  const [quota, setQuota] = useState("");

  const [categories, setCategories] = useState([]);
  const [quotas, setQuotas] = useState([]);

  const [sortDirection, setSortDirection] = useState("asc");
  const [programFilter, setProgramFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/ipudata.json");
        const json = await res.json();

        // Normalize column names
        const cleaned = json.map(row => ({
          ...row,
          "Closing Rank": parseInt(row["Closing\r\nRank"]),
          "Category": row["Category"].trim(),
          "Quota": row["Quota"].trim(),
          "Program": row["Program"].trim(),
          "Institute": row["Institute"].trim()
        }));

        setData(cleaned);
        setCategories([...new Set(cleaned.map(d => d["Category"]))].sort());
        setQuotas([...new Set(cleaned.map(d => d["Quota"]))].sort());
      } catch (err) {
        console.error("Error loading IPU data:", err);
        alert("Failed to load IPU data.");
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const inputRank = parseInt(rank);

    const results = data.filter(row => {
      const validRank = !isNaN(row["Closing Rank"]) && inputRank <= row["Closing Rank"];
      const matchCategory = row["Category"] === category;
      const matchQuota = row["Quota"] === quota;
      return validRank && matchCategory && matchQuota;
    });

    setFiltered(results);
    setSortDirection("asc");
    setProgramFilter("");
    setCollegeFilter("");
    setClicked(true);
  };

  const handleReset = () => {
    setUsername("");
    setRank("");
    setCategory("");
    setQuota("");
    setFiltered([]);
    setClicked(false);
    setProgramFilter("");
    setCollegeFilter("");
  };

  const sortByRank = () => {
    const dir = sortDirection === "asc" ? "desc" : "asc";
    const sorted = [...filtered].sort((a, b) =>
      dir === "asc" ? a["Closing Rank"] - b["Closing Rank"] : b["Closing Rank"] - a["Closing Rank"]
    );
    setFiltered(sorted);
    setSortDirection(dir);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`IPU Predicted Colleges for ${username}`, 10, 10);
    doc.text(`Rank: ${rank} | Category: ${category} | Quota: ${quota}`, 10, 18);

    const tableBody = displayedResults.map(row => [
      row["Institute"],
      row["Program"],
      row["Quota"],
      row["Category"],
      row["Closing Rank"]
    ]);

    autoTable(doc, {
      head: [["College", "Program", "Quota", "Category", "Closing Rank"]],
      body: tableBody,
      startY: 25,
      styles: { fontSize: 7 },
      tableWidth: "auto"
    });

    doc.save(`IPU_${username.replace(/\s+/g, "_")}_Predictions.pdf`);
  };

  const displayedResults = filtered.filter(row => {
    const progMatch = programFilter ? row["Program"] === programFilter : true;
    const collMatch = collegeFilter ? row["Institute"] === collegeFilter : true;
    return progMatch && collMatch;
  });

  return (
    <div className="container">
      <h1>IPU College Predictor 2025</h1>
      <form onSubmit={handleSubmit} className="form">
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your Name" required />
        <input type="number" value={rank} onChange={e => setRank(e.target.value)} placeholder="Your JEE Rank" required />
        <select value={category} onChange={e => setCategory(e.target.value)} required>
          <option value="">Select Category</option>
          {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>
        <select value={quota} onChange={e => setQuota(e.target.value)} required>
          <option value="">Select Quota</option>
          {quotas.map((q, i) => <option key={i} value={q}>{q}</option>)}
        </select>
        <div className="form-buttons">
          <button type="submit">Predict Colleges</button>
          <button type="button" className="reset-btn" onClick={handleReset}>Reset</button>
        </div>
      </form>

      {filtered.length > 0 ? (
        <>
          <h2>Predicted Colleges for {username}</h2>
          <div className="table-controls">
            <div className="button-row">
              <button onClick={downloadPDF}>Download PDF</button>
              <button onClick={sortByRank}>
                Sort by Closing Rank {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>
            <div className="filters">
              <div>
                <label>Filter by Program:</label>
                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
                  <option value="">All Programs</option>
                  {[...new Set(filtered.map(r => r["Program"]))].sort().map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Filter by College:</label>
                <select value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)}>
                  <option value="">All Colleges</option>
                  {[...new Set(filtered.map(r => r["Institute"]))].sort().map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>College</th>
                  <th>Program</th>
                  <th>Quota</th>
                  <th>Category</th>
                  <th>Closing Rank</th>
                </tr>
              </thead>
              <tbody>
                {displayedResults.map((row, i) => (
                  <tr key={i}>
                    <td>{row["Institute"]}</td>
                    <td>{row["Program"]}</td>
                    <td>{row["Quota"]}</td>
                    <td>{row["Category"]}</td>
                    <td>{row["Closing Rank"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (clicked && <p className="notFound">No result found</p>)}
    </div>
  );
}

export default App;
