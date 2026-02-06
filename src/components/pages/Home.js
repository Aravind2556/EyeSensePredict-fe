import React, { useState, useEffect, useMemo } from "react";
import LiveChart from "../blocks/LiveChart";
import { URL } from "../../utils/Range";

function Home() {
  const labels = [
    "Eye Surface Temprature",
    "Ocular Redness Index",
   "Tear Flim Stablity",
    "Perfusion Index",
    "Ocular Oxygeneration Level",
    "tissue Health Index",
     "Ocular Hyderation Index",
  ];

  const [fieldOne, setFieldOne] = useState(null); // contains full flattened 18-band y-axis and x-axis timestamps
  const [fieldTwo, setFieldTwo] = useState(null); // NIR / field2 history

  const [recentPredictValue, setRecentPredictValue] = useState(null);
  const [recentTempValue, setRecentTempValue] = useState(null);
  const [recentTearFilm, setRecentTearFilm] = useState(null);
  const [recentPerfusionValue, setRecentPerfusionValue] = useState(null);
  const [recentOxygenationValue, setRecentOxygenationValue] = useState(null);
  const [recentTissueHealthValue, setRecentTissueHealthValue] = useState(null);
  const [recentOcularHydrationValue, setRecentOcularHydrationValue] = useState(null);
  
  const [predictData, setPredictData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Labels for each value in latest_values (keep order same as backend)




  // convertedObject (parsed last prediction CSV into named object)
  const convertedObject = useMemo(() => {
    if (!recentPredictValue) return {};
    return recentPredictValue.split(",").reduce((acc, value, index) => {
      const label = labels[index] ?? `col_${index}`;
      acc[label] = Number(value);
      return acc;
    }, {});
  }, [recentPredictValue, labels]);

  const controls = {
    zoom: true,
    pan: true,
    toolbar: true
  };

  useEffect(() => {
    if (!URL) return;

    // single fetch that processes feeds in one pass (more efficient)
    const fetchData = async () => {
      try {
        const res = await fetch(URL);
        const data = await res.json();
        const feeds = data?.feeds ?? [];
        if (feeds.length === 0) {
          return;
        }

        const timestamps = new Array(feeds.length);
        const field2History = new Array(feeds.length);

        // flattened array: feed1 -> 18 values, feed2 -> 18 values, ...
        const flattenedField1 = [];

        // We'll capture last known values (from last feed)
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

          // field1 is a CSV of 18 bands (expected). If missing, insert NaNs to keep alignment.
          if (f.field1) {
            const parts = f.field1.split(",").map(v => {
              const n = Number(v);
              return Number.isFinite(n) ? n : NaN;
            });
            // if not length 18, pad/truncate to 18 to keep consistent indexing
            if (parts.length >= 18) {
              flattenedField1.push(...parts.slice(0, 18));
            } else {
              flattenedField1.push(...parts, ...new Array(18 - parts.length).fill(NaN));
            }
          } else {
            flattenedField1.push(...new Array(18).fill(NaN));
          }

          // capture last-known values (overwrite each loop; end result is last feed's values)
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
          seriesName: "CLEAR VALUE"
        });

        setFieldTwo({
          "x-axis": timestamps,
          "y-axis": field2History,
          color: "red",
          seriesName: "NIR"
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

    // initial fetch + interval
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [URL]);



//   /* ===================== PREDICT API ===================== */
    useEffect(() => {
      const controller = new AbortController();

      const fetchPredict = async () => {
        try {
          setLoading(true);
          setError(null);

          const res = await fetch("/predict", {
            method: "GET",
            signal: controller.signal,
          });

          if (!res.ok) throw new Error(`Server ${res.status}`);

          const data = await res.json();
          console.log("Predict:", data);
          setPredictData(data);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Predict error:", err);
            setError(err.message);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchPredict();
      const id = setInterval(fetchPredict, 5000);

      return () => {
        controller.abort();
        clearInterval(id);
      };
    }, []);


  const fmt = (v) => {
    if (v === null || v === undefined) return "—";
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(3) : String(v);
  };


  const splitEighteenBands = fieldOne?.["y-axis"] || [];

  const channelColors = {
    // Blue Band
    A: "#1d4ed8",
    B: "#7e22ce",
    C: "#701a75",
    // Green Band
    D: "#dc2626",
    E: "#ea580c",
    F: "#84cc16",
    G: "#10b981",
    // Red Band
    H: "#0891b2",
    R: "#dc2626",
    I: "#db2777",
    // Deep Red
    S: "#9333ea",
    J: "#dc2626",
    // NIR-1
    T: "#65a30d",
    U: "#059669",
    V: "#0d9488",
    // NIR-2
    W: "#2563eb",
    K: "#e11d48",
    L: "#9333ea"
  };

  const channelSeries = (channelIndex, channelName) => {
    const x = fieldOne?.["x-axis"] ?? [];
    // pick every 18th value starting at channelIndex
    const y = splitEighteenBands.filter((_, i) => i % 18 === channelIndex);
    return {
      "x-axis": x,
      "y-axis": y,
      color: channelColors[channelName],
      seriesName: channelName
    };
  };

  const isAbNormal = predictData?.prediction === "Abnormal";

  if (!fieldOne || !fieldTwo) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="mx-auto space-y-10 md:px-10 px-2 mb-10">

<div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 px-2">

  {/* Eye Redness */}
  <div className="p-6 rounded-xl bg-white border border-red-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-red-600 font-semibold">Eye Redness</p>
    <p className="mt-2 text-3xl font-bold text-red-700">
      {recentPredictValue ?? "--"}
    </p>
  </div>

  {/* Tear Film */}
  <div className="p-6 rounded-xl bg-white border border-cyan-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-cyan-600 font-semibold">Tear Film</p>
    <p className="mt-2 text-3xl font-bold text-cyan-700">
      {recentTearFilm ?? "--"}
    </p>
  </div>

  {/* Perfusion */}
  <div className="p-6 rounded-xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-emerald-600 font-semibold">Perfusion</p>
    <p className="mt-2 text-3xl font-bold text-emerald-700">
      {recentPerfusionValue ?? "--"}
    </p>
  </div>

  {/* Oxygenation */}
  <div className="p-6 rounded-xl bg-white border border-indigo-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-indigo-600 font-semibold">Oxygenation</p>
    <p className="mt-2 text-3xl font-bold text-indigo-700">
      {recentOxygenationValue ?? "--"}
    </p>
  </div>

  {/* Tissue Health */}
  <div className="p-6 rounded-xl bg-white border border-yellow-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-yellow-600 font-semibold">Tissue Health</p>
    <p className="mt-2 text-3xl font-bold text-yellow-700">
      {recentTissueHealthValue ?? "--"}
    </p>
  </div>

    {/* Hyderation */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Hyderation</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentOcularHydrationValue ?? "--"}
    </p>
  </div>

  {/* Eye Temperature */}
  <div className="p-6 rounded-xl bg-white border border-rose-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-rose-600 font-semibold">Eye Temperature</p>
    <p className="mt-2 text-3xl font-bold text-rose-700">
      {recentTempValue ?? "--"}°C
    </p>

  </div>

    <div className="p-6 rounded-xl bg-white border border-sky-200 shadow-sm hover:shadow-md transition">
    <p className="text-sm text-sky-500 font-semibold">Hyderation</p>
    <p className="mt-2 text-3xl font-bold text-sky-700">
      {recentOcularHydrationValue ?? "--"}°C
    </p>

  </div>

</div>
  <div
    className={`
      w-full lg:w-[380px]
      bg-white rounded-xl p-5
      border
      shadow-sm
      transition-all
      ${
        !isAbNormal
          ? "border-green-400 shadow-[inset_0_0_12px_rgba(34,197,94,0.35)]"
          : "border-red-400 shadow-[inset_0_0_12px_rgba(239,68,68,0.35)]"
      }
    `}
  >
    <h2 className="text-lg font-semibold text-gray-800 mb-3">
      Prediction Summary
    </h2>
    
    {error && (
      <p className="text-red-600 text-sm">
        Error: {error}
      </p>
    )}


      <>
        <ul className="space-y-2 text-sm">
          {labels.map((label, i) => (
            <li
              key={label}
              className="flex justify-between border-b last:border-b-0 pb-1"
            >
              <span className="font-medium text-gray-600">
                {label}
              </span>
              <span className="text-gray-900">
                {predictData?.latest_values?.[i] !== undefined
                  ? fmt(predictData.latest_values[i])
                  : "—"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Overall Prediction
          </p>

          <span
            className={`
              px-3 py-1 rounded-full text-sm font-semibold
              ${
                !isAbNormal
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            `}
          >
            {predictData?.prediction ?? "—"}
          </span>
        </div>
      </>
    
  </div>
</div>



      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Tear film / surface scatter</h3>
          <LiveChart
            data={[channelSeries(0, "A"), channelSeries(1, "B"), channelSeries(2, "C")]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Blood perfusion</h3>
          <LiveChart
            data={[channelSeries(3, "D"), channelSeries(4, "E"), channelSeries(5, "F"), channelSeries(6, "G")]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Eye redness / hemoglobin</h3>
          <LiveChart
            data={[channelSeries(7, "H"), channelSeries(8, "R"), channelSeries(9, "I")]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Blood volume</h3>
          <LiveChart data={[channelSeries(10, "S"), channelSeries(11, "J")]} chartType="line" lineStyle="straight" lineWidth={2} controls={controls} />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Tissue penetration</h3>
          <LiveChart
            data={[channelSeries(12, "T"), channelSeries(13, "U"), channelSeries(14, "V")]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">Water hydration</h3>
          <LiveChart
            data={[channelSeries(15, "W"), channelSeries(16, "K"), channelSeries(17, "L")]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;






// import React, { useState, useEffect, useMemo } from "react";
// import LiveChart from "../blocks/LiveChart";
// import { URL } from "../../utils/Range";

// function Home() {
//   const labels = [
//     "Eye Surface Temperature",
//     "Ocular Redness Index",
//     "Tear Film Stability",
//     "Perfusion Index",
//     "Ocular Oxygenation Level",
//     "Tissue Health Index",
//     "Ocular Hydration Index",
//   ];

//   const [fieldOne, setFieldOne] = useState(null);
//   const [fieldTwo, setFieldTwo] = useState(null);

//   const [recentPredictValue, setRecentPredictValue] = useState(null);
//   const [recentTempValue, setRecentTempValue] = useState(null);
//   const [recentTearFilm, setRecentTearFilm] = useState(null);
//   const [recentPerfusionValue, setRecentPerfusionValue] = useState(null);
//   const [recentOxygenationValue, setRecentOxygenationValue] = useState(null);
//   const [recentTissueHealthValue, setRecentTissueHealthValue] = useState(null);
//   const [recentOcularHydrationValue, setRecentOcularHydrationValue] = useState(null);

//   const [predictData, setPredictData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   /* ===================== FORMAT ===================== */
//   const fmt = (v) => {
//     if (v === null || v === undefined) return "—";
//     const n = Number(v);
//     return Number.isFinite(n) ? n.toFixed(3) : String(v);
//   };

//   /* ===================== THINGSPEAK FETCH ===================== */
//   useEffect(() => {
//     if (!URL) return;

//     const fetchData = async () => {
//       try {
//         const res = await fetch(URL);
//         const data = await res.json();
//         const feeds = data?.feeds ?? [];
//         if (!feeds.length) return;

//         const timestamps = [];
//         const field2History = [];
//         const flattenedField1 = [];

//         let lastPredict = null,
//           lastTear = null,
//           lastTemp = null,
//           lastPerf = null,
//           lastOxy = null,
//           lastTissue = null,
//           lastHydration = null;

//         feeds.forEach((f) => {
//           timestamps.push(new Date(f.created_at).getTime());
//           field2History.push(Number(f.field2) || 0);

//           if (f.field1) {
//             const parts = f.field1.split(",").map(Number);
//             flattenedField1.push(...parts.slice(0, 18));
//           } else {
//             flattenedField1.push(...new Array(18).fill(NaN));
//           }

//           lastPredict = f.field3 ?? lastPredict;
//           lastTear = f.field4 ?? lastTear;
//           lastTemp = f.field2 ?? lastTemp;
//           lastPerf = f.field5 ?? lastPerf;
//           lastOxy = f.field6 ?? lastOxy;
//           lastTissue = f.field7 ?? lastTissue;
//           lastHydration = f.field8 ?? lastHydration;
//         });

//         setFieldOne({
//           "x-axis": timestamps,
//           "y-axis": flattenedField1,
//           color: "blue",
//           seriesName: "CLEAR VALUE",
//         });

//         setFieldTwo({
//           "x-axis": timestamps,
//           "y-axis": field2History,
//           color: "red",
//           seriesName: "NIR",
//         });

//         setRecentPredictValue(lastPredict);
//         setRecentTearFilm(lastTear);
//         setRecentTempValue(lastTemp);
//         setRecentPerfusionValue(lastPerf);
//         setRecentOxygenationValue(lastOxy);
//         setRecentTissueHealthValue(lastTissue);
//         setRecentOcularHydrationValue(lastHydration);
//       } catch (err) {
//         console.error("ThingSpeak error:", err);
//       }
//     };

//     fetchData();
//     const id = setInterval(fetchData, 5000);
//     return () => clearInterval(id);
//   }, []);

//   /* ===================== PREDICT API ===================== */
//   useEffect(() => {
//     const controller = new AbortController();

//     const fetchPredict = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const res = await fetch("/predict", {
//           method: "GET",
//           signal: controller.signal,
//         });

//         if (!res.ok) throw new Error(`Server ${res.status}`);

//         const data = await res.json();
//         console.log("Predict:", data);
//         setPredictData(data);
//       } catch (err) {
//         if (err.name !== "AbortError") {
//           console.error("Predict error:", err);
//           setError(err.message);
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPredict();
//     const id = setInterval(fetchPredict, 5000);

//     return () => {
//       controller.abort();
//       clearInterval(id);
//     };
//   }, []);

//   /* ===================== CHART HELPERS ===================== */
//   const splitBands = fieldOne?.["y-axis"] || [];
//   const channelColors = {
//     A: "#1d4ed8",
//     B: "#7e22ce",
//     C: "#701a75",
//     D: "#dc2626",
//     E: "#ea580c",
//     F: "#84cc16",
//     G: "#10b981",
//     H: "#0891b2",
//     R: "#dc2626",
//     I: "#db2777",
//     S: "#9333ea",
//     J: "#dc2626",
//     T: "#65a30d",
//     U: "#059669",
//     V: "#0d9488",
//     W: "#2563eb",
//     K: "#e11d48",
//     L: "#9333ea",
//   };

//   const channelSeries = (index, name) => ({
//     "x-axis": fieldOne?.["x-axis"] || [],
//     "y-axis": splitBands.filter((_, i) => i % 18 === index),
//     color: channelColors[name],
//     seriesName: name,
//   });

//   const isAbNormal = predictData?.prediction === "Abnormal";

//   if (!fieldOne || !fieldTwo) {
//     return <div className="text-center mt-10">Loading sensor data…</div>;
//   }

//   /* ===================== UI ===================== */
//   return (
//     <div className="mx-auto space-y-10 px-2 md:px-10 mb-10">

//       {/* ===================== TOP SUMMARY ===================== */}
//       <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">

//         {/* LEFT CARDS */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
//           {[
//             ["Eye Redness", recentPredictValue, "red"],
//             ["Tear Film", recentTearFilm, "cyan"],
//             ["Perfusion", recentPerfusionValue, "emerald"],
//             ["Oxygenation", recentOxygenationValue, "indigo"],
//             ["Tissue Health", recentTissueHealthValue, "yellow"],
//             ["Eye Temperature", `${recentTempValue ?? "--"}°C`, "rose"],
//             ["Hydration", recentOcularHydrationValue, "sky"],
//           ].map(([title, value, color]) => (
//             <div
//               key={title}
//               className={`p-5 rounded-xl bg-white border border-${color}-200 shadow-sm`}
//             >
//               <p className={`text-sm font-semibold text-${color}-600`}>
//                 {title}
//               </p>
//               <p className={`mt-2 text-2xl font-bold text-${color}-700`}>
//                 {value ?? "--"}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* RIGHT PREDICTION */}
//         <div
//           className={`w-full lg:w-[380px] p-5 rounded-xl bg-white border shadow-sm
//           ${isAbNormal ? "border-red-400" : "border-green-400"}`}
//         >
//           <h2 className="font-semibold mb-3">Prediction Summary</h2>

          
//           {error && <p className="text-sm text-red-600">{error}</p>}


//             <>
//               <ul className="text-sm space-y-2">
//                 {labels.map((l, i) => (
//                   <li key={l} className="flex justify-between">
//                     <span>{l}</span>
//                     <span>{fmt(predictData?.latest_values?.[i])}</span>
//                   </li>
//                 ))}
//               </ul>

//               <div className="mt-4 flex justify-between items-center border-t pt-3">
//                 <span>Overall</span>
//                 <span
//                   className={`px-3 py-1 rounded-full text-sm font-semibold
//                   ${isAbNormal ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
//                 >
//                   {predictData?.prediction ?? "—"}
//                 </span>
//               </div>
//             </>
       
//         </div>
//       </div>

//       {/* ===================== CHARTS ===================== */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <LiveChart data={[channelSeries(0, "A"), channelSeries(1, "B"), channelSeries(2, "C")]} />
//         <LiveChart data={[channelSeries(3, "D"), channelSeries(4, "E"), channelSeries(5, "F"), channelSeries(6, "G")]} />
//         <LiveChart data={[channelSeries(7, "H"), channelSeries(8, "R"), channelSeries(9, "I")]} />
//         <LiveChart data={[channelSeries(10, "S"), channelSeries(11, "J")]} />
//         <LiveChart data={[channelSeries(12, "T"), channelSeries(13, "U"), channelSeries(14, "V")]} />
//         <LiveChart data={[channelSeries(15, "W"), channelSeries(16, "K"), channelSeries(17, "L")]} />
//       </div>
//     </div>
//   );
// }

// export default Home;
