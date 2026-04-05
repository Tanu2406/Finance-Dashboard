import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b"];

const fetchTransactions = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, date: "2026-04-01", amount: 5000, category: "Salary", type: "income" },
        { id: 2, date: "2026-04-02", amount: 200, category: "Food", type: "expense" },
        { id: 3, date: "2026-03-10", amount: 800, category: "Shopping", type: "expense" },
      ]);
    }, 500);
  });

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [role, setRole] = useState("viewer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("none");

  const [form, setForm] = useState({
    date: "",
    amount: "",
    category: "",
    type: "expense"
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("transactions");
    if (saved) setTransactions(JSON.parse(saved));
    else fetchTransactions().then(setTransactions);
  }, []);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const income = transactions.filter(t => t.type === "income").reduce((a,b)=>a+b.amount,0);
  const expense = transactions.filter(t => t.type === "expense").reduce((a,b)=>a+b.amount,0);
  const balance = income - expense;

  let filtered = transactions
    .filter(t => role==="admin" ? (filter==="all" || t.type===filter) : true)
    .filter(t => 
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.type.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search)
    );

  if (sort==="asc") filtered.sort((a,b)=>a.amount-b.amount);
  if (sort==="desc") filtered.sort((a,b)=>b.amount-a.amount);

  const categoryData = Object.values(
    transactions.reduce((acc,t)=>{
      if(t.type==="expense"){
        acc[t.category] = acc[t.category] || {name:t.category,value:0};
        acc[t.category].value += t.amount;
      }
      return acc;
    },{})
  );

  const topCategory = categoryData.length
    ? categoryData.reduce((a,b)=>a.value>b.value?a:b).name
    : "N/A";

  const monthly = {};
  transactions.forEach(t=>{
    const m = t.date.slice(0,7);
    monthly[m] = (monthly[m]||0)+t.amount;
  });

  const saveTransaction = () => {
    if (!form.amount || !form.category) return;

    if (editId) {
      setTransactions(transactions.map(t =>
        t.id === editId ? { ...form, id: editId, amount: Number(form.amount) } : t
      ));
      setEditId(null);
    } else {
      setTransactions([...transactions, {
        ...form,
        id: Date.now(),
        amount: Number(form.amount)
      }]);
    }

    setForm({ date:"", amount:"", category:"", type:"expense" });
  };

  const editTransaction = (t) => {
    setForm(t);
    setEditId(t.id);
    setPage("transactions");
  };

  const inputStyle = "w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm focus:ring-2 focus:ring-blue-400 outline-none";
  const btn = "px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow";

  const downloadCSV = () => {
    const headers = ["Date", "Amount", "Category", "Type"];
    const rows = transactions.map(t => [t.date, t.amount, t.category, t.type]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={dark 
      ? "bg-gray-900 text-white min-h-screen flex transition-all duration-300" 
      : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 min-h-screen flex transition-all duration-300"}>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-gradient-to-b from-blue-600 to-purple-600 text-white p-6 h-full">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">💰 Finance</h2>
            {[
              {name:"dashboard", icon:"📊"},
              {name:"transactions", icon:"💳"},
              {name:"insights", icon:"📈"}
            ].map(item=>(
              <button
                key={item.name}
                onClick={()=>{setPage(item.name); setMobileMenuOpen(false);}}
                className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg mb-3 transition ${
                  page===item.name
                    ? "bg-white text-blue-600 font-semibold shadow"
                    : "hover:bg-white/20"
                }`}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-64 bg-gradient-to-b from-blue-600 to-purple-600 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">💰 Finance</h2>

        {[
          {name:"dashboard", icon:"📊"},
          {name:"transactions", icon:"💳"},
          {name:"insights", icon:"📈"}
        ].map(item=>(
          <button
            key={item.name}
            onClick={()=>setPage(item.name)}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg mb-3 transition ${
              page===item.name
                ? "bg-white text-blue-600 font-semibold shadow"
                : "hover:bg-white/20"
            }`}
          >
            {item.icon} {item.name}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-4 md:p-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between mb-4 md:mb-6 items-start md:items-center gap-4 md:gap-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-2xl">☰</button>
            <h1 className="text-2xl md:text-3xl font-bold">Finance Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={downloadCSV} className={`${btn} w-full sm:w-auto`}>CSV</button>
            <button onClick={downloadJSON} className={`${btn} w-full sm:w-auto`}>JSON</button>
            <button onClick={()=>setDark(!dark)} className={`${btn} w-full sm:w-auto`}>🌙</button>

            <select onChange={(e)=>setRole(e.target.value)} className={`${inputStyle} w-full sm:w-auto`}>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* DASHBOARD */}
        {page==="dashboard" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
              <Card title="Balance" value={balance}/>
              <Card title="Income" value={income}/>
              <Card title="Expense" value={expense}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Glass title="Trend">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={transactions}>
                    <XAxis dataKey="date"/>
                    <YAxis/>
                    <Tooltip/>
                    <Line dataKey="amount" stroke="#6366f1"/>
                  </LineChart>
                </ResponsiveContainer>
              </Glass>

              <Glass title="Expenses">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value">
                      {categoryData.map((_,i)=>(
                        <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                      ))}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>

                {categoryData.map((c,i)=>(
                  <div key={i} className="flex items-center gap-2 text-sm mt-1">
                    <div className="w-3 h-3 rounded-full" style={{background: COLORS[i % COLORS.length]}}></div>
                    {c.name}
                  </div>
                ))}
              </Glass>
            </div>
          </>
        )}

        {/* TRANSACTIONS */}
        {page==="transactions" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6 items-stretch sm:items-center">

  {/* SEARCH BAR */}
  <div className="relative w-full">
    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>

    <input
      type="text"
      placeholder="Search transactions..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 
      bg-white dark:bg-gray-800 text-black dark:text-white 
      shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>

              <select onChange={(e)=>setFilter(e.target.value)} className={`${inputStyle} w-full sm:w-auto`}>
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select onChange={(e)=>setSort(e.target.value)} className={`${inputStyle} w-full sm:w-auto`}>
                <option value="none">Sort</option>
                <option value="asc">Low→High</option>
                <option value="desc">High→Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-6">
            {role==="admin" && (
              <Glass title="Add / Edit Transaction">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="date" className={inputStyle}
                    value={form.date}
                    onChange={(e)=>setForm({...form,date:e.target.value})}
                  />
                  <input placeholder="Amount" className={inputStyle}
                    value={form.amount}
                    onChange={(e)=>setForm({...form,amount:e.target.value})}
                  />
                  <input placeholder="Category" className={inputStyle}
                    value={form.category}
                    onChange={(e)=>setForm({...form,category:e.target.value})}
                  />
                  <select className={inputStyle}
                    value={form.type}
                    onChange={(e)=>setForm({...form,type:e.target.value})}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <button onClick={saveTransaction} className={`${btn} mt-4`}>
                  {editId ? "Update" : "Add"}
                </button>
              </Glass>
              )}

              <Glass title="Transactions">
              <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base text-gray-900 dark:text-white">
                <thead className="text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="text-left">Date</th><th className="text-left">Amount</th><th className="text-left">Category</th><th className="text-left">Type</th>
                    {role==="admin" && <th className="text-left">Action</th>}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(t=>(
                    <tr key={t.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <td className="py-2">{t.date}</td>
                      <td className="py-2">₹{t.amount}</td>
                      <td className="py-2">{t.category}</td>
                      <td className="py-2">{t.type}</td>

                      {role==="admin" && (
                        <td className="py-2">
                          <button onClick={()=>editTransaction(t)} className="text-blue-500 mr-2 hover:underline text-sm">Edit</button>
                          <button onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))} className="text-red-500 hover:underline text-sm">
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </Glass>
            </div>
          </>
        )}

        {/* INSIGHTS */}
        {page==="insights" && (
          <Glass title="Insights">
            <p className="text-gray-800 dark:text-gray-200 mb-2">
              🔥 Top Category: <b>{topCategory}</b>
            </p>

            {Object.entries(monthly).map(([m,v])=>(
              <p key={m} className="text-gray-700 dark:text-gray-300">
                {m}: ₹{v}
              </p>
            ))}
          </Glass>
        )}

      </div>
    </div>
  );
}

const Card = ({ title, value }) => {
  const styles = {
    Balance: "from-blue-500 to-blue-700",
    Income: "from-green-500 to-green-700",
    Expense: "from-red-500 to-red-700",
  };

  return (
    <div className={`p-4 md:p-6 rounded-xl shadow-lg text-white bg-gradient-to-r ${styles[title]} hover:scale-105 transition`}>
      <h3 className="text-sm opacity-80">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold mt-2">₹{value}</p>
    </div>
  );
};

const Glass = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 md:p-6 rounded-xl shadow-lg transition hover:shadow-xl">
    <h2 className="mb-3 font-semibold text-lg">{title}</h2>
    {children}
  </div>
);