import React, { useState, useEffect, useMemo } from "react";
import LiveChart from "../blocks/LiveChart";
import { URL } from "../../utils/Range";

function Home() {
  const labels = [
    "Eye Surface Temperature",
    "Ocular Redness Index",
    "Tear Film Stability",
    "Perfusion Index",
    "Ocular Oxygenation Level",
    "Tissue Health Index",
    "Ocular Hydration Index",
  ];

  const [fieldOne, setFieldOne] = useState(null); // flattened 18-band y-axis and x-axis timestamps
  const [fieldTwo, setFieldTwo] = useState(null); // NIR / field2 history

  const [recentPredictValue, setRecentPredictValue] = useState(null); // CSV or single-string from field3
  const [recentTempValue, setRecentTempValue] = useState(null);
  const [recentTearFilm, setRecentTearFilm] = useState(null);
  const [recentPerfusionValue, setRecentPerfusionValue] = useState(null);
  const [recentOxygenationValue, setRecentOxygenationValue] = useState(null);
  const [recentTissueHealthValue, setRecentTissueHealthValue] = useState(null);
  const [recentOcularHydrationValue, setRecentOcularHydrationValue] = useState(null);

  const [predictData, setPredictData] = useState(null); // from /predict (latest_values + prediction)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------- NORMAL RANGES ----------
  const NORMAL_RANGES = {
    "Eye Surface Temperature": { min: 32.0, max: 35.0, unit: "°C" },
    "Ocular Redness Index": { min: 0, max: 20, unit: "" },
    "Tear Film Stability": { min: 10, max: 30, unit: "sec" },
    "Perfusion Index": { min: 0.4, max: 0.7, unit: "" },
    "Ocular Oxygenation Level": { min: 95, max: 100, unit: "%" },
    "Tissue Health Index": { min: 70, max: 100, unit: "" },
    "Ocular Hydration Index": { min: 60, max: 100, unit: "" },
  };

  const isValueNormal = (label, value) => {
    const range = NORMAL_RANGES[label];
    if (!range || value === undefined || value === null || Number.isNaN(Number(value)))
      return true; // treat missing as neutral (not flagged)
    const n = Number(value);
    return n >= range.min && n <= range.max;
  };

  const formatRange = (range) => {
    if (!range) return "—";
    if (range.max === Infinity) {
      return `≥ ${range.min} ${range.unit}`.trim();
    }
    return `${range.min} – ${range.max} ${range.unit}`.trim();
  };

  const fmt = (v) => {
    if (v === null || v === undefined) return "—";
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(3) : String(v);
  };

  // ------------ Parse ThingSpeak / feeds ------------
  useEffect(() => {
    if (!URL) return;

    let mounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(URL);
        const data = await res.json();
        const feeds = data?.feeds ?? [];
        if (!mounted || feeds.length === 0) return;

        const timestamps = new Array(feeds.length);
        const field2History = new Array(feeds.length);
        const flattenedField1 = [];

        let lastPredict = null;
        let lastTear = null;
        let lastTemp = null;
        let lastPerfusion = null;
        let lastOxy = null;
        let lastTissue = null;
        let lastHydration = null;

        for (let i = 0; i < feeds.length; i++) {
          const f = feeds[i];
          timestamps[i] = new Date(f.created_at).getTime();
          field2History[i] = Number(f.field2) || 0;

          if (f.field1) {
            const parts = f.field1.split(",").map((v) => {
              const n = Number(v.trim());
              return Number.isFinite(n) ? n : NaN;
            });
            if (parts.length >= 18) {
              flattenedField1.push(...parts.slice(0, 18));
            } else {
              flattenedField1.push(
                ...parts,
                ...new Array(18 - parts.length).fill(NaN)
              );
            }
          } else {
            flattenedField1.push(...new Array(18).fill(NaN));
          }

          lastPredict = f.field3 ?? lastPredict;
          lastTear = f.field4 ?? lastTear;
          lastTemp = f.field2 ?? lastTemp;
          lastPerfusion = f.field5 ?? lastPerfusion;
          lastOxy = f.field6 ?? lastOxy;
          lastTissue = f.field7 ?? lastTissue;
          lastHydration = f.field8 ?? lastHydration;
        }

        setFieldOne({
          "x-axis": timestamps,
          "y-axis": flattenedField1,
          color: "blue",
          seriesName: "CLEAR VALUE",
        });

        setFieldTwo({
          "x-axis": timestamps,
          "y-axis": field2History,
          color: "red",
          seriesName: "NIR",
        });

        setRecentPredictValue(lastPredict ?? null);
        setRecentTearFilm(lastTear ?? null);
        setRecentTempValue(lastTemp ?? null);
        setRecentPerfusionValue(lastPerfusion ?? null);
        setRecentOxygenationValue(lastOxy ?? null);
        setRecentTissueHealthValue(lastTissue ?? null);
        setRecentOcularHydrationValue(lastHydration ?? null);
      } catch (err) {
        console.error("ThingSpeak fetch error:", err);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [URL]);

  // ------------ Predict API polling ------------
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchPredict = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/predict", { method: "GET", signal: controller.signal });
        if (!res.ok) throw new Error(`Server ${res.status}`);

        const data = await res.json();
        if (!mounted) return;
        setPredictData(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Predict error:", err);
          setError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPredict();
    const id = setInterval(fetchPredict, 5000);
    return () => {
      mounted = false;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  // If predictData.latest_values exist (array), create map label -> value
  const latestValuesMap = useMemo(() => {
    const map = {};
    const arr = predictData?.latest_values ?? [];

    for (let i = 0; i < labels.length; i++) {
      const key = labels[i];
      const v = arr[i];
      // fallback to the "recent" state if predictData doesn't include
      if (v !== undefined && v !== null && v !== "") {
        map[key] = Number.isFinite(Number(v)) ? Number(v) : v;
      } else {
        // try the legacy recentX variables
        switch (key) {
          case "Eye Surface Temperature":
            map[key] = recentTempValue ?? null;
            break;
          case "Tear Film Stability":
            map[key] = recentTearFilm ?? null;
            break;
          case "Perfusion Index":
            map[key] = recentPerfusionValue ?? null;
            break;
          case "Ocular Oxygenation Level":
            map[key] = recentOxygenationValue ?? null;
            break;
          case "Tissue Health Index":
            map[key] = recentTissueHealthValue ?? null;
            break;
          case "Ocular Hydration Index":
            map[key] = recentOcularHydrationValue ?? null;
            break;
          case "Ocular Redness Index":
            // if recentPredictValue is CSV, try split
            if (recentPredictValue && typeof recentPredictValue === "string") {
              const parts = recentPredictValue.split(",").map((p) => p.trim());
              // assume redness is index 0 if CSV order matches labels — adjust if not
              map[key] = parts[0] ? Number(parts[0]) : null;
            } else {
              map[key] = null;
            }
            break;
          default:
            map[key] = null;
        }
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    predictData?.latest_values,
    recentTempValue,
    recentTearFilm,
    recentPerfusionValue,
    recentOxygenationValue,
    recentTissueHealthValue,
    recentOcularHydrationValue,
    recentPredictValue,
  ]);

  // Overall abnormal detection: if any required parameter outside normal -> Abnormal
  const computedIsAbnormal = useMemo(() => {
    for (const k of labels) {
      const v = latestValuesMap[k];
      if (v === null || v === undefined || Number.isNaN(Number(v))) continue; // skip missing
      if (!isValueNormal(k, v)) return true;
    }
    // fallback to server prediction if present
    if (predictData?.prediction && predictData.prediction === "Abnormal") return true;
    return false;
  }, [labels, latestValuesMap, predictData]);

  const isAbNormal = computedIsAbnormal; // replace original

  // ---------- chart helpers ----------
  const splitEighteenBands = fieldOne?.["y-axis"] || [];

  const channelColors = {
    A: "#1d4ed8",
    B: "#7e22ce",
    C: "#701a75",
    D: "#dc2626",
    E: "#ea580c",
    F: "#84cc16",
    G: "#10b981",
    H: "#0891b2",
    R: "#dc2626",
    I: "#db2777",
    S: "#9333ea",
    J: "#dc2626",
    T: "#65a30d",
    U: "#059669",
    V: "#0d9488",
    W: "#2563eb",
    K: "#e11d48",
    L: "#9333ea",
  };

  const channelSeries = (channelIndex, channelName) => {
    const x = fieldOne?.["x-axis"] ?? [];
    // pick every 18th value starting at channelIndex — results in one value per feed (same length as x)
    const y = splitEighteenBands.filter((_, i) => i % 18 === channelIndex);
    return {
      "x-axis": x,
      "y-axis": y,
      color: channelColors[channelName] ?? "#111827",
      seriesName: channelName,
    };
  };

  if (!fieldOne || !fieldTwo || !predictData) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // controls for LiveChart
  const controls = { zoom: true, pan: true, toolbar: true };

  return (
    <div className="mx-auto space-y-10 md:px-10 px-2 mb-10">

        <div className="flex flex-wrap gap-3 justify-between">
          {/* Eye Redness */}
          <div className="p-6 rounded-xl bg-white border border-red-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-red-600 font-semibold">Ocular Redness Index</p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {latestValuesMap["Ocular Redness Index"] !== undefined
                ? fmt(latestValuesMap["Ocular Redness Index"])
                : "--"}
            </p>
          </div>

          {/* Tear Film */}
          <div className="p-6 rounded-xl bg-white border border-cyan-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-cyan-600 font-semibold">Tear Film Stability</p>
            <p className="mt-2 text-3xl font-bold text-cyan-700">
              {latestValuesMap["Tear Film Stability"] !== undefined
                ? fmt(latestValuesMap["Tear Film Stability"])
                : "--"}
            </p>
          </div>

          {/* Perfusion */}
          <div className="p-6 rounded-xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-emerald-600 font-semibold">Perfusion Index</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {latestValuesMap["Perfusion Index"] !== undefined ? fmt(latestValuesMap["Perfusion Index"]) : "--"}
            </p>
          </div>

          {/* Oxygenation */}
          <div className="p-6 rounded-xl bg-white border border-indigo-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-indigo-600 font-semibold">Ocular Oxygenation</p>
            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {latestValuesMap["Ocular Oxygenation Level"] !== undefined
                ? fmt(latestValuesMap["Ocular Oxygenation Level"]) + (NORMAL_RANGES["Ocular Oxygenation Level"].unit || "")
                : "--"}
            </p>
          </div>

          {/* Tissue Health */}
          <div className="p-6 rounded-xl bg-white border border-yellow-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-yellow-600 font-semibold">Tissue Health Index</p>
            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {latestValuesMap["Tissue Health Index"] !== undefined ? fmt(latestValuesMap["Tissue Health Index"]) : "--"}
            </p>
          </div>

          {/* Eye Temperature */}
          <div className="p-6 rounded-xl bg-white border border-rose-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-rose-600 font-semibold">Eye Surface Temperature</p>
            <p className="mt-2 text-3xl font-bold text-rose-700">
              {latestValuesMap["Eye Surface Temperature"] !== undefined
                ? fmt(latestValuesMap["Eye Surface Temperature"]) + "°C"
                : "--"}
            </p>
          </div>

          {/* Hydration */}
          <div className="p-6 rounded-xl bg-white border border-sky-200 shadow-sm hover:shadow-md transition">
            <p className="text-sm text-sky-500 font-semibold">Ocular Hydration Index</p>
            <p className="mt-2 text-3xl font-bold text-sky-700">
              {latestValuesMap["Ocular Hydration Index"] !== undefined ? fmt(latestValuesMap["Ocular Hydration Index"]) : "--"}
            </p>
          </div>
        </div>

        <div>
                  {/* Clinical Prediction Summary */}
        <div
          className={`
            w-full 
            bg-white rounded-2xl p-6
            border shadow-sm transition-all
            ${
              !isAbNormal
                ? "border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                : "border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
            }
          `}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Clinical Prediction Summary</h2>

          {error && <p className="text-red-600 text-sm mb-3">Error: {error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2 text-gray-600 font-semibold">Parameter</th>
                  <th className="text-left px-3 py-2 text-gray-600 font-semibold">Normal Range</th>
                  <th className="text-right px-3 py-2 text-gray-600 font-semibold">Value</th>
                </tr>
              </thead>

              <tbody>
                {labels.map((label, i) => {
                  const value = latestValuesMap[label];
                  const range = NORMAL_RANGES[label];
                  const normal = isValueNormal(label, value);

                  // progress percent (0-100) within range (handles Infinity)
                  const percent =
                    range && value !== undefined && value !== null && Number.isFinite(Number(value))
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            ((Number(value) - range.min) /
                              ((range.max === Infinity ? Math.max(range.min * 2, Number(value)) : range.max) - range.min)) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <tr key={label} className={`border-b last:border-b-0 ${!normal ? "bg-red-50" : "hover:bg-gray-50"}`}>
                      <td className="px-3 py-3 font-medium text-gray-700">{label}</td>

                      <td className="px-3 py-3 text-xs text-gray-500">
                        {formatRange(range)}
                        <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${normal ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${percent}%` }} />
                        </div>
                      </td>

                      <td className={`px-3 py-3 text-right font-semibold ${normal ? "text-green-700" : "text-red-700"}`}>
                        {value !== undefined && value !== null && Number.isFinite(Number(value)) ? fmt(value) : "—"}
                        {range?.unit && (label !== "Eye Surface Temperature" ? range.unit : "")}
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${normal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {normal ? "Normal" : "Abnormal"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Overall Status */}
          <div className="mt-5 pt-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">Overall Clinical Assessment</p>

            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${!isAbNormal ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {predictData?.prediction ?? (isAbNormal ? "Abnormal" : "Normal")}
            </span>
          </div>
        </div>
        </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Tear film / surface scatter</h3>
          <LiveChart data={[channelSeries(0, "A"), channelSeries(1, "B"), channelSeries(2, "C")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Blood perfusion</h3>
          <LiveChart data={[channelSeries(3, "D"), channelSeries(4, "E"), channelSeries(5, "F"), channelSeries(6, "G")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Eye redness / hemoglobin</h3>
          <LiveChart data={[channelSeries(7, "H"), channelSeries(8, "R"), channelSeries(9, "I")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Blood volume</h3>
          <LiveChart data={[channelSeries(10, "S"), channelSeries(11, "J")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Tissue penetration</h3>
          <LiveChart data={[channelSeries(12, "T"), channelSeries(13, "U"), channelSeries(14, "V")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Water hydration</h3>
          <LiveChart data={[channelSeries(15, "W"), channelSeries(16, "K"), channelSeries(17, "L")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>
      </div>
    </div>
  );
}

export default Home;
