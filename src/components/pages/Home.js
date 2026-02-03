import React, { useState, useEffect, useMemo } from "react";
import LiveChart from "../blocks/LiveChart";
import { URL } from "../../utils/Range";

function Home() {
  const labels = [
    "Eye Redness",
    "Tear Film",
    "Blood Perfusion",
    "Oxygenation",
    "Tissue",
    "Hydration",
    // (these labels map to the 18-band splitted array indexes you already use)
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
<<<<<<< HEAD
        if (data?.feeds?.length > 0) {
          // 🔹 Combine all feeds (history)
          const allValues = data.feeds.flatMap(feed =>
            feed.field1 ? feed.field1.split(",").map(Number) : []
          );

          setFieldOne({
            "x-axis": data.feeds.map(f =>
              new Date(f.created_at).getTime()
            ),
            "y-axis": allValues,
            color: "blue",
            seriesName: "CLEAR VALUE"
          });

          setFieldTwo({
            "x-axis": data.feeds.map(f =>
              new Date(f.created_at).getTime()
            ),
            "y-axis": data.feeds.map(f => Number(f.field2) || 0),
            color: "red",
            seriesName: "NIR"
          });

          const lastValue = data.feeds.map(feed => feed.field3).slice(-1)[0];
          
          setRecentPredictValue(lastValue);

          const lastTempValue = data.feeds.map(feed => feed.field2).slice(-1)[0];
          setRecentTempValue(lastTempValue);

=======
        const feeds = data?.feeds ?? [];
        if (feeds.length === 0) {
          return;
>>>>>>> c173983defe7dc503e7c924e061d4689f036edb7
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

  if (!fieldOne || !fieldTwo) {
    return <div className="text-center mt-10">Loading...</div>;
  }
console.log("values are :-", convertedObject)
  return (
    <div className="mx-auto space-y-10 md:px-10 px-2 mb-10">
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-3 
  xl:grid-cols-4 
  gap-6 
  px-2
">

  {/* Eye Redness */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500 to-red-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Eye Redness</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentPredictValue ?? "--"}
    </p>
  </div>

  {/* Tear Film */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Tear Film</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentTearFilm ?? "--"}
    </p>
  </div>

  {/* Perfusion */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Perfusion</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentPerfusionValue ?? "--"}
    </p>
  </div>

  {/* Oxygenation */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Oxygenation</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentOxygenationValue ?? "--"}
    </p>
  </div>

  {/* Tissue Health */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Tissue Health</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentTissueHealthValue ?? "--"}
    </p>
  </div>

  {/* Eye Surface Temperature */}
  <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
    <p className="text-lg sm:text-xl font-bold">Eye Temperature</p>
    <p className="mt-3 font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
      {recentTempValue ?? "--"}°C
    </p>
    <p className="mt-1 text-xs sm:text-sm opacity-80">
      Live Sensor Data
    </p>
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
