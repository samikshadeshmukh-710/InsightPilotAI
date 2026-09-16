import { useState } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("📊 Dashboard");
  const [fileName, setFileName] = useState("");

  const [stats, setStats] = useState({
    sales: 0,
    customers: 0,
    products: 0,
    growth: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [countryData, setCountryData] = useState([]);

  // Prediction
  const [predictedSales, setPredictedSales] = useState(0);
  const [predictionData, setPredictionData] = useState([]);
  const [trendDirection, setTrendDirection] =
    useState("No Data");

  // Recommendations
  const [recommendations, setRecommendations] =
    useState([]);

  // Performance
  const [performanceScore, setPerformanceScore] =
    useState(0);
  const [performanceChecked, setPerformanceChecked] =
    useState(false);

  const menuItems = [
    "📊 Dashboard",
    "📁 Upload Dataset",
    "📈 Analytics",
    "🔮 Predictions",
    "💡 Recommendations",
    "📄 Reports",
  ];

  const pageName = activePage.replace(/^.+?\s/, "");

  // ================= PERFORMANCE =================

  const calculatePerformance = (growth) => {
    const growthValue = Number(growth) || 0;

    const growthScore = Math.max(
      0,
      Math.min(100, 100 + growthValue)
    );

    return Number(growthScore.toFixed(1));
  };

  const handlePerformanceCheck = () => {
    const score = calculatePerformance(stats.growth);

    setPerformanceScore(score);
    setPerformanceChecked(true);
  };

  // ================= PREDICTION =================

  const calculatePrediction = (monthlyData) => {
    if (monthlyData.length === 0) {
      setPredictedSales(0);
      setPredictionData([]);
      setTrendDirection("No Data");

      return "No Data";
    }

    if (monthlyData.length === 1) {
      const value = monthlyData[0].sales;

      setPredictedSales(
        Number(value.toFixed(2))
      );

      setPredictionData([
        {
          month: monthlyData[0].month,
          actual: Number(value.toFixed(2)),
          predicted: null,
        },
        {
          month: "Next Month",
          actual: null,
          predicted: Number(value.toFixed(2)),
        },
      ]);

      setTrendDirection("Stable");

      return "Stable";
    }

    const n = monthlyData.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    monthlyData.forEach((item, index) => {
      const x = index + 1;
      const y = Number(item.sales) || 0;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const denominator =
      n * sumX2 - sumX * sumX;

    let slope = 0;
    let intercept = 0;

    if (denominator !== 0) {
      slope =
        (n * sumXY - sumX * sumY) /
        denominator;

      intercept =
        (sumY - slope * sumX) / n;
    }

    const nextX = n + 1;

    let prediction =
      intercept + slope * nextX;

    prediction = Math.max(0, prediction);

    prediction = Number(
      prediction.toFixed(2)
    );

    setPredictedSales(prediction);

    let direction = "Stable";

    if (slope > 0) {
      direction = "Increasing";
    } else if (slope < 0) {
      direction = "Decreasing";
    }

    setTrendDirection(direction);

    // IMPORTANT:
    // Return the actual trend so Recommendations
    // gets the correct value.
    const combinedData = monthlyData.map(
      (item) => ({
        month: item.month,
        actual: Number(
          item.sales.toFixed(2)
        ),
        predicted: null,
      })
    );

    combinedData.push({
      month: "Next Month",
      actual: null,
      predicted: prediction,
    });

    setPredictionData(combinedData);

    return direction;
  };

  // ================= RECOMMENDATIONS =================

  const generateRecommendations = (
    products,
    countries,
    growth,
    trend
  ) => {
    const result = [];

    // Best-selling product
    if (products.length > 0) {
      const bestProduct = products[0];

      result.push({
        icon: "🏆",
        title: "Best-Selling Product",
        text:
          `${bestProduct.product} is the top-performing product. ` +
          `Consider maintaining its stock and promoting it further.`,
      });

      // Low-performing product
      if (products.length >= 2) {
        const lowestProduct =
          products[products.length - 1];

        result.push({
          icon: "⚠️",
          title: "Low-Performing Product",
          text:
            `${lowestProduct.product} has relatively lower sales among the top products. ` +
            `Review its pricing, demand, or promotion.`,
        });
      }
    }

    // Top country
    if (countries.length > 0) {
      const topCountry = countries[0];

      result.push({
        icon: "🌍",
        title: "Top Market",
        text:
          `${topCountry.country} generates the highest sales. ` +
          `Consider focusing marketing and customer retention efforts on this market.`,
      });
    }

    // Correct sales trend
    if (trend === "Increasing") {
      result.push({
        icon: "📈",
        title: "Positive Sales Trend",
        text:
          "Sales show an increasing trend. Continue current strategies and consider expanding successful products.",
      });
    } else if (trend === "Decreasing") {
      result.push({
        icon: "📉",
        title: "Sales Improvement Needed",
        text:
          "Sales show a decreasing trend. Review product demand, pricing, and marketing strategies.",
      });
    } else {
      result.push({
        icon: "📊",
        title: "Stable Sales",
        text:
          "Sales are relatively stable. Focus on customer retention and improving product performance.",
      });
    }

    // Growth recommendation
    if (Number(growth) > 0) {
      result.push({
        icon: "💼",
        title: "Business Opportunity",
        text:
          "Positive growth indicates an opportunity to expand high-performing products and markets.",
      });
    } else {
      result.push({
        icon: "💡",
        title: "Business Improvement",
        text:
          "Focus on improving sales performance by identifying weak products and strengthening high-value markets.",
      });
    }

    setRecommendations(result);
  };

  // ================= FILE UPLOAD =================

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        const data = results.data;

        const monthlySales = {};
        const productSales = {};
        const countrySales = {};

        data.forEach((row) => {
          const date = new Date(
            row.InvoiceDate
          );

          if (isNaN(date)) return;

          const month =
            date.toLocaleString(
              "default",
              {
                month: "short",
              }
            );

          const sales =
            (Number(row.Quantity) || 0) *
            (Number(row.Price) || 0);

          // Monthly Sales
          if (!monthlySales[month]) {
            monthlySales[month] = 0;
          }

          monthlySales[month] += sales;

          // Product Sales
          const product =
            row.Description || "Unknown";

          if (!productSales[product]) {
            productSales[product] = 0;
          }

          productSales[product] += sales;

          // Country Sales
          const country =
            row.Country || "Unknown";

          if (!countrySales[country]) {
            countrySales[country] = 0;
          }

          countrySales[country] += sales;
        });

        // ================= MONTHLY SALES =================

        const chartData = Object.keys(
          monthlySales
        ).map((month) => ({
          month,
          sales: Number(
            monthlySales[month].toFixed(2)
          ),
        }));

        setSalesData(chartData);

        // IMPORTANT:
        // Get the actual trend returned by prediction.
        const predictionTrend =
          calculatePrediction(chartData);

        // ================= TOP PRODUCTS =================

        const topProducts = Object.entries(
          productSales
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([product, sales]) => ({
            product:
              product.length > 15
                ? product.substring(0, 15) +
                  "..."
                : product,
            sales: Number(
              sales.toFixed(2)
            ),
          }));

        setProductData(topProducts);

        // ================= TOP COUNTRIES =================

        const topCountries = Object.entries(
          countrySales
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([country, sales]) => ({
            country,
            sales: Number(
              sales.toFixed(2)
            ),
          }));

        setCountryData(topCountries);

        // ================= TOTAL SALES =================

        const sales = data.reduce(
          (total, row) => {
            return (
              total +
              (Number(row.Quantity) || 0) *
                (Number(row.Price) || 0)
            );
          },
          0
        );

        // ================= CUSTOMERS =================

        const customers = new Set(
          data
            .map((row) =>
              String(
                row["Customer ID"] || ""
              ).trim()
            )
            .filter(Boolean)
        ).size;

        // ================= PRODUCTS =================

        const products = new Set(
          data
            .map((row) =>
              String(
                row.StockCode || ""
              ).trim()
            )
            .filter(Boolean)
        ).size;

        // ================= GROWTH =================

        const dates = data
          .map(
            (row) =>
              new Date(
                row.InvoiceDate
              )
          )
          .filter(
            (date) => !isNaN(date)
          );

        let growth = 0;

        if (dates.length > 1) {
          const sortedDates = [
            ...dates,
          ].sort((a, b) => a - b);

          const firstDate =
            sortedDates[0];

          const lastDate =
            sortedDates[
              sortedDates.length - 1
            ];

          const firstSales =
            data.reduce(
              (total, row) => {
                const date =
                  new Date(
                    row.InvoiceDate
                  );

                if (
                  date.getTime() ===
                  firstDate.getTime()
                ) {
                  return (
                    total +
                    (Number(
                      row.Quantity
                    ) || 0) *
                      (Number(
                        row.Price
                      ) || 0)
                  );
                }

                return total;
              },
              0
            );

          const lastSales =
            data.reduce(
              (total, row) => {
                const date =
                  new Date(
                    row.InvoiceDate
                  );

                if (
                  date.getTime() ===
                  lastDate.getTime()
                ) {
                  return (
                    total +
                    (Number(
                      row.Quantity
                    ) || 0) *
                      (Number(
                        row.Price
                      ) || 0)
                  );
                }

                return total;
              },
              0
            );

          if (firstSales > 0) {
            growth = Number(
              (
                ((lastSales -
                  firstSales) /
                  firstSales) *
                100
              ).toFixed(2)
            );
          }
        }

        setStats({
          sales,
          customers,
          products,
          growth,
        });

        // ================= PERFORMANCE =================

        const score =
          calculatePerformance(
            growth
          );

        setPerformanceScore(score);
        setPerformanceChecked(false);

        // ================= RECOMMENDATIONS =================
        // Uses the correct prediction trend.

        generateRecommendations(
          topProducts,
          topCountries,
          growth,
          predictionTrend
        );
      },
    });
  };


  // ================= PROFESSIONAL REPORT =================

  const downloadProfessionalReport = () => {
    const money = (value) =>
      `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;

    const products = productData
      .map(
        (item, i) =>
          `<tr><td>${i + 1}</td><td>${item.product}</td><td>${money(item.sales)}</td></tr>`
      )
      .join("");

    const countries = countryData
      .map(
        (item, i) =>
          `<tr><td>${i + 1}</td><td>${item.country}</td><td>${money(item.sales)}</td></tr>`
      )
      .join("");

    const months = salesData
      .map(
        (item) =>
          `<tr><td>${item.month}</td><td>${money(item.sales)}</td></tr>`
      )
      .join("");

    const insights = recommendations
      .map(
        (item) =>
          `<div class="insight"><b>${item.title}</b><p>${item.text}</p></div>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>InsightPilot AI - Business Analytics Report</title>
<style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eef3f8;font-family:Arial,Helvetica,sans-serif;color:#172033}
.page{width:210mm;min-height:297mm;padding:22mm 20mm;background:#fff;margin:0 auto 12px;page-break-after:always;position:relative}
.page:last-child{page-break-after:auto}.cover{background:linear-gradient(145deg,#102a43,#173f5f);color:#fff;display:flex;flex-direction:column;justify-content:center}
.brand{font-size:34px;font-weight:700}.accent{width:70px;height:4px;background:#f5a623;margin:22px 0}.cover h1{font-size:31px;margin:0 0 10px}.cover p{color:#dbe7f0}
h2{color:#173f5f;font-size:23px;margin:0 0 18px}h3{color:#173f5f;font-size:16px;margin:0 0 8px}
p{font-size:12px;line-height:1.55}.muted{color:#64748b}.meta{margin-top:28px;font-size:12px;line-height:1.9}
.kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:18px 0 24px}.kpi{border:1px solid #dce5ee;border-left:5px solid #173f5f;padding:14px;background:#f8fafc;border-radius:7px}.kpi span{display:block;color:#64748b;font-size:10px;margin-bottom:6px}.kpi strong{color:#173f5f;font-size:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.box{border:1px solid #dce5ee;border-radius:7px;padding:14px}
table{width:100%;border-collapse:collapse;font-size:10px}th{background:#173f5f;color:#fff;text-align:left;padding:8px}td{padding:7px 8px;border-bottom:1px solid #e5eaf0}
.note{background:#f5f8fb;border-left:4px solid #f5a623;padding:12px;margin:12px 0;font-size:11px;line-height:1.5}
.insight{border:1px solid #dce5ee;border-left:4px solid #173f5f;padding:10px 12px;margin-bottom:10px;border-radius:6px}.insight b{color:#173f5f;font-size:12px}.insight p{margin:5px 0 0;font-size:10px}
.footer{position:absolute;bottom:11mm;left:20mm;right:20mm;border-top:1px solid #dce5ee;padding-top:6px;color:#94a3b8;font-size:8px;display:flex;justify-content:space-between}
@media print{body{background:#fff}.page{margin:0}}
</style>
</head>
<body>

<section class="page cover">
<div class="brand">InsightPilot AI</div><div class="accent"></div>
<h1>Business Analytics Report</h1>
<p>Intelligent Decision Support using Data Analytics and Machine Learning</p>
<div class="meta"><b>Dataset:</b> ${fileName || "Uploaded Business Dataset"}<br><b>Report Date:</b> ${new Date().toLocaleDateString("en-IN")}</div>
</section>

<section class="page">
<h2>01 — Dataset, Data Dictionary & Data Quality</h2>
<div class="section"><h3>Dataset</h3><p>The report is generated from the uploaded business CSV dataset and its calculated business measures.</p></div>
<div class="section"><h3>Data Dictionary</h3>
<table><tr><th>Attribute</th><th>Description</th></tr>
<tr><td>Invoice</td><td>Invoice or transaction identifier.</td></tr>
<tr><td>StockCode</td><td>Unique product code.</td></tr>
<tr><td>Description</td><td>Product description.</td></tr>
<tr><td>Quantity</td><td>Transaction quantity.</td></tr>
<tr><td>InvoiceDate</td><td>Transaction date and time.</td></tr>
<tr><td>Price</td><td>Unit price.</td></tr>
<tr><td>Customer ID</td><td>Customer identifier.</td></tr>
<tr><td>Country</td><td>Customer or market country.</td></tr></table></div>
<div class="section"><h3>Data Quality</h3><div class="note">Sales are calculated as Quantity × Price. Invalid InvoiceDate values are excluded from time-based analysis.</div></div>
<div class="footer"><span>InsightPilot AI</span><span>Page 2 of 5</span></div>
</section>

<section class="page">
<h2>02 — Cleaning, Preprocessing & EDA</h2>
<div class="kpis">
<div class="kpi"><span>Total Sales</span><strong>${money(stats.sales)}</strong></div>
<div class="kpi"><span>Total Customers</span><strong>${stats.customers.toLocaleString()}</strong></div>
<div class="kpi"><span>Total Products</span><strong>${stats.products.toLocaleString()}</strong></div>
<div class="kpi"><span>Growth Rate</span><strong>${stats.growth}%</strong></div>
</div>
<h3>Cleaning & Preprocessing</h3><p>The CSV data is parsed and prepared using the available transaction, product, customer, date, price and country attributes. Missing category values used for aggregation are handled as Unknown.</p>
<div class="grid">
<div class="box"><h3>Monthly Sales</h3><table><tr><th>Month</th><th>Sales</th></tr>${months || "<tr><td colspan='2'>No data</td></tr>"}</table></div>
<div class="box"><h3>Top 5 Products</h3><table><tr><th>Rank</th><th>Product</th><th>Sales</th></tr>${products || "<tr><td colspan='3'>No data</td></tr>"}</table></div>
</div>
<div class="footer"><span>InsightPilot AI</span><span>Page 3 of 5</span></div>
</section>

<section class="page">
<h2>03 — Statistics, Graphs & Correlation</h2>
<div class="grid">
<div class="box"><h3>Statistics</h3><p><b>Total Sales:</b> ${money(stats.sales)}</p><p><b>Customers:</b> ${stats.customers.toLocaleString()}</p><p><b>Products:</b> ${stats.products.toLocaleString()}</p><p><b>Growth:</b> ${stats.growth}%</p></div>
<div class="box"><h3>Prediction & Performance</h3><p><b>Predicted Next Month Sales:</b> ${money(predictedSales)}</p><p><b>Sales Trend:</b> ${trendDirection}</p><p><b>Performance Score:</b> ${performanceScore}%</p></div>
</div>
<h3 style="margin-top:22px">Graphs</h3><p>The application visualizes monthly sales, top products, country-wise sales and business performance to support comparison and decision-making.</p>
<h3>Correlation</h3><div class="note">The current application does not calculate a numerical correlation matrix, so no unsupported correlation values are included.</div>
<h3>Top Markets</h3><table><tr><th>Rank</th><th>Country</th><th>Sales</th></tr>${countries || "<tr><td colspan='3'>No data</td></tr>"}</table>
<div class="footer"><span>InsightPilot AI</span><span>Page 4 of 5</span></div>
</section>

<section class="page">
<h2>04 — Business Insights, Limitations & Conclusion</h2>
<h3>Business Insights</h3>${insights || "<p class='muted'>No recommendations available.</p>"}
<h3>Prediction</h3><div class="note"><b>Predicted Next Month Sales:</b> ${money(predictedSales)}<br><b>Sales Trend:</b> ${trendDirection}</div>
<h3>Limitations</h3><p>The report depends on the quality and completeness of the uploaded dataset. The current prediction is a trend-based analytical estimate from historical monthly sales and is not a guaranteed future result.</p>
<h3>Conclusion</h3><p>InsightPilot AI transforms uploaded business data into structured analytics, visual insights, performance indicators, predictions and data-driven recommendations for decision support.</p>
<div class="footer"><span>InsightPilot AI</span><span>Page 5 of 5</span></div>
</section>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "InsightPilot_Business_Analytics_Report.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ================= DONUT =================

  const donutData = [
    {
      name: "Performance",
      value: performanceScore,
    },
    {
      name: "Remaining",
      value:
        100 - performanceScore,
    },
  ];

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            IP
          </div>

          <div>
            <h2>InsightPilot</h2>
            <span>
              AI Analytics
            </span>
          </div>

        </div>

        <nav>

          {menuItems.map((item) => (

            <button
              key={item}
              className={`nav-item ${
                activePage === item
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActivePage(item)
              }
            >
              {item}
            </button>

          ))}

        </nav>

        <div className="sidebar-bottom">

          <span>
            InsightPilot AI
          </span>

          <small>
            Decision Support System
          </small>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <div>

            <p className="welcome">
              InsightPilot AI
            </p>

            <h1>{pageName}</h1>

          </div>

          <label className="upload-btn">

            + Upload Dataset

            <input
              type="file"
              accept=".csv"
              hidden
              onChange={
                handleFileUpload
              }
            />

          </label>

        </header>

        {/* ================================================= */}
        {/* ================= DASHBOARD ===================== */}
        {/* ================================================= */}

        {activePage ===
          "📊 Dashboard" && (
          <>

            <section className="stats-grid">

              <div className="stat-card">

                <span>
                  Total Sales
                </span>

                <h2>
                  ₹
                  {stats.sales.toLocaleString()}
                </h2>

                <small>
                  From uploaded dataset
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Total Customers
                </span>

                <h2>
                  {stats.customers.toLocaleString()}
                </h2>

                <small>
                  Unique customers
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Total Products
                </span>

                <h2>
                  {stats.products.toLocaleString()}
                </h2>

                <small>
                  Unique products
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Growth Rate
                </span>

                <h2>
                  {stats.growth}%
                </h2>

                <small>
                  Business growth
                </small>

              </div>

            </section>

            <section className="dashboard-layout">

              <div className="left-charts">

                {/* TOP PRODUCTS */}

                <div className="chart-panel">

                  <div className="chart-heading">

                    <div>
                      <h2>
                        Top 5 Products
                      </h2>

                      <span>
                        Product Sales
                      </span>
                    </div>

                  </div>

                  <ResponsiveContainer
                    width="100%"
                    height={150}
                  >

                    <BarChart
                      data={productData}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="product"
                        fontSize={9}
                      />

                      <YAxis
                        fontSize={9}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="sales"
                        fill="#173f5f"
                        radius={[
                          4,
                          4,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

                {/* MONTHLY SALES */}

                <div className="chart-panel">

                  <div className="chart-heading">

                    <div>
                      <h2>
                        Monthly Sales
                      </h2>

                      <span>
                        Sales Trend
                      </span>
                    </div>

                  </div>

                  <ResponsiveContainer
                    width="100%"
                    height={150}
                  >

                    <LineChart
                      data={salesData}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="month"
                        fontSize={9}
                      />

                      <YAxis
                        fontSize={9}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#f5a623"
                        strokeWidth={3}
                        dot={false}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </div>

              </div>

              {/* PERFORMANCE */}

              <div className="donut-panel">

                <div className="chart-heading">

                  <div>
                    <h2>
                      Performance
                    </h2>

                    <span>
                      Overall Score
                    </span>
                  </div>

                </div>

                <div className="donut-container">

                  <ResponsiveContainer
                    width="100%"
                    height={210}
                  >

                    <PieChart>

                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={78}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >

                        <Cell
                          fill="#173f5f"
                        />

                        <Cell
                          fill="#f5a623"
                        />

                      </Pie>

                    </PieChart>

                  </ResponsiveContainer>

                  <div className="donut-number">
                    {performanceScore}%
                  </div>

                </div>

                <div className="donut-list">

                  <p>
                    Business Performance
                  </p>

                  <p>
                    Sales Analysis
                  </p>

                  <p>
                    Customer Analysis
                  </p>

                  <p>
                    Product Performance
                  </p>

                </div>

                <button
                  className="check-btn"
                  onClick={
                    handlePerformanceCheck
                  }
                >
                  Check Now
                </button>

                {performanceChecked && (

                  <small
                    style={{
                      display:
                        "block",
                      textAlign:
                        "center",
                      marginTop:
                        "8px",
                      color:
                        "#64748b",
                    }}
                  >
                    Performance
                    checked
                    successfully.
                  </small>

                )}

              </div>

            </section>

          </>
        )}

        {/* ================================================= */}
        {/* ================= ANALYTICS ===================== */}
        {/* ================================================= */}

        {activePage ===
          "📈 Analytics" && (

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1fr",
              gap: "16px",
              height:
                "calc(100vh - 145px)",
              minHeight: 0,
            }}
          >

            <div
              style={{
                display: "grid",
                gridTemplateRows:
                  "1fr 1fr",
                gap: "16px",
                minHeight: 0,
              }}
            >

              {/* MONTHLY SALES */}

              <div className="chart-panel">

                <div className="chart-heading">

                  <div>
                    <h2>
                      Monthly Sales Trend
                    </h2>

                    <span>
                      Sales performance over time
                    </span>
                  </div>

                </div>

                {salesData.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="85%"
                  >

                    <LineChart
                      data={salesData}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="month"
                        fontSize={11}
                      />

                      <YAxis
                        fontSize={11}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#173f5f"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                ) : (

                  <div
                    style={{
                      height: "80%",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color:
                        "#64748b",
                    }}
                  >
                    Upload a CSV dataset
                    to view the sales
                    trend.
                  </div>

                )}

              </div>

              {/* TOP PRODUCTS */}

              <div className="chart-panel">

                <div className="chart-heading">

                  <div>
                    <h2>
                      Top 5 Products
                    </h2>

                    <span>
                      Products generating
                      highest sales
                    </span>
                  </div>

                </div>

                {productData.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="82%"
                  >

                    <BarChart
                      data={productData}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="product"
                        fontSize={10}
                      />

                      <YAxis
                        fontSize={10}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="sales"
                        fill="#173f5f"
                        radius={[
                          5,
                          5,
                          0,
                          0,
                        ]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                ) : (

                  <div
                    style={{
                      height: "80%",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color:
                        "#64748b",
                    }}
                  >
                    Upload a CSV dataset
                    to view top
                    products.
                  </div>

                )}

              </div>

            </div>

            {/* COUNTRY-WISE SALES */}

            <div className="chart-panel">

              <div className="chart-heading">

                <div>
                  <h2>
                    Country-wise Sales
                  </h2>

                  <span>
                    Top 5 countries by
                    sales
                  </span>
                </div>

              </div>

              {countryData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="88%"
                >

                  <BarChart
                    layout="vertical"
                    data={countryData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 5,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      type="number"
                      fontSize={10}
                    />

                    <YAxis
                      type="category"
                      dataKey="country"
                      width={70}
                      fontSize={10}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="sales"
                      fill="#f5a623"
                      radius={[
                        0,
                        5,
                        5,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <div
                  style={{
                    height: "80%",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    textAlign:
                      "center",
                    color:
                      "#64748b",
                  }}
                >
                  Upload a CSV dataset
                  to view
                  country-wise sales.
                </div>

              )}

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* ================= PREDICTIONS ================== */}
        {/* ================================================= */}

        {activePage ===
          "🔮 Predictions" && (

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gridTemplateRows:
                "auto 1fr",
              gap: "16px",
              height:
                "calc(100vh - 145px)",
              minHeight: 0,
            }}
          >

            {/* PREDICTED SALES */}

            <div
              className="chart-panel"
              style={{
                padding: "20px",
              }}
            >

              <span
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                }}
              >
                Predicted Next Month Sales
              </span>

              <h2
                style={{
                  fontSize:
                    "30px",
                  margin:
                    "10px 0",
                  color:
                    "#173f5f",
                }}
              >
                ₹
                {predictedSales.toLocaleString()}
              </h2>

              <small
                style={{
                  color:
                    "#64748b",
                }}
              >
                Based on historical
                monthly sales trend
              </small>

            </div>

            {/* TREND */}

            <div
              className="chart-panel"
              style={{
                padding: "20px",
              }}
            >

              <span
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                }}
              >
                Sales Trend
              </span>

              <h2
                style={{
                  fontSize:
                    "30px",
                  margin:
                    "10px 0",
                  color:
                    "#173f5f",
                }}
              >
                {trendDirection}
              </h2>

              <small
                style={{
                  color:
                    "#64748b",
                }}
              >
                Trend identified from
                uploaded dataset
              </small>

            </div>

            {/* PREDICTION CHART */}

            <div
              className="chart-panel"
              style={{
                gridColumn:
                  "1 / 3",
                minHeight: 0,
              }}
            >

              <div className="chart-heading">

                <div>
                  <h2>
                    Sales Prediction
                  </h2>

                  <span>
                    Historical sales and
                    predicted next month
                  </span>
                </div>

              </div>

              {predictionData.length >
              0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="82%"
                >

                  <LineChart
                    data={predictionData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="month"
                      fontSize={11}
                    />

                    <YAxis
                      fontSize={11}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual Sales"
                      stroke="#173f5f"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted Sales"
                      stroke="#f5a623"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                      dot={{ r: 5 }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div
                  style={{
                    height: "80%",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    color:
                      "#64748b",
                  }}
                >
                  Upload a CSV dataset
                  to generate sales
                  predictions.
                </div>

              )}

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* ============== RECOMMENDATIONS ================== */}
        {/* ================================================= */}

        {activePage ===
          "💡 Recommendations" && (

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: "16px",
              height:
                "calc(100vh - 145px)",
              overflowY: "auto",
              paddingBottom: "10px",
            }}
          >

            {recommendations.length >
            0 ? (

              recommendations.map(
                (item, index) => (

                  <div
                    key={index}
                    className="chart-panel"
                    style={{
                      padding: "24px",
                      minHeight:
                        "170px",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "14px",
                        marginBottom:
                          "14px",
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            "30px",
                        }}
                      >
                        {item.icon}
                      </div>

                      <h2
                        style={{
                          margin: 0,
                          color:
                            "#173f5f",
                          fontSize:
                            "20px",
                        }}
                      >
                        {item.title}
                      </h2>

                    </div>

                    <p
                      style={{
                        margin: 0,
                        color:
                          "#64748b",
                        lineHeight:
                          "1.6",
                        fontSize:
                          "14px",
                      }}
                    >
                      {item.text}
                    </p>

                  </div>

                )
              )

            ) : (

              <div
                className="chart-panel"
                style={{
                  gridColumn:
                    "1 / 3",
                  display: "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  textAlign:
                    "center",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "45px",
                  }}
                >
                  💡
                </div>

                <h2>
                  No Recommendations Yet
                </h2>

                <p
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Upload a CSV dataset to
                  generate data-driven
                  business recommendations.
                </p>

              </div>

            )}

          </section>
        )}

        {/* ================================================= */}
        {/* ================= REPORTS ======================= */}
        {/* ================================================= */}

        {activePage === "📄 Reports" && (
          <section
            style={{
              height: "calc(100vh - 145px)",
              overflowY: "auto",
              paddingBottom: "20px",
            }}
          >
            <div
              className="chart-panel"
              style={{
                padding: "24px",
                marginBottom: "16px",
                background:
                  "linear-gradient(135deg, #102a43 0%, #173f5f 100%)",
                color: "white",
              }}
            >
              <span style={{ fontSize: "12px", opacity: 0.8 }}>
                INSIGHTPILOT AI
              </span>
              <h2 style={{ color: "white", fontSize: "28px", margin: "8px 0" }}>
                Business Analytics Report
              </h2>
              <p style={{ color: "#dbe7f0", margin: 0 }}>
                Generate a professional 5-page report from the current dataset.
              </p>
            </div>

            <div
              className="chart-panel"
              style={{ padding: "22px", marginBottom: "16px" }}
            >
              <h2 style={{ color: "#173f5f" }}>Report Sections</h2>
              <p style={{ color: "#64748b", lineHeight: "1.6" }}>
                Dataset → Data Dictionary → Data Quality → Cleaning →
                Preprocessing → EDA → Statistics → Graphs → Correlation →
                Business Insights → Limitations → Conclusion
              </p>

              <button
                className="check-btn"
                onClick={downloadProfessionalReport}
                style={{ minWidth: "210px", marginTop: "10px" }}
              >
                Download Report
              </button>
            </div>
          </section>
        )}

        {/* ================================================= */}
        {/* ================= OTHER PAGES ================== */}
        {/* ================================================= */}

        {activePage !== "📊 Dashboard" &&
          activePage !== "📈 Analytics" &&
          activePage !== "🔮 Predictions" &&
          activePage !== "💡 Recommendations" &&
          activePage !== "📄 Reports" && (
            <section className="welcome-panel">

              <div className="panel-icon">
                📊
              </div>

              <h2>{pageName}</h2>

              <p>
                This section will be developed step-by-step.
              </p>

              {activePage === "📁 Upload Dataset" && (
                <label className="primary-btn">
                  Select CSV File

                  <input
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleFileUpload}
                  />
                </label>
              )}

              {fileName && (
                <p>
                  Selected file:{" "}
                  {fileName}
                </p>
              )}

            </section>
          )}

      </main>

    </div>
  );
}

export default App;