import React, { useState, useEffect } from "react";
import LiveChart from "../blocks/LiveChart";
import { URL } from "../../utils/Range";

function Home() {
  const labels = ["Eye Redness", "Tear Film", "Blood Perfusion", "Oxygenation", "Tissue", "Hydration"];

  const [fieldOne, setFieldOne] = useState(null);
  const [fieldTwo, setFieldTwo] = useState(null);

  const [recentPredictValue, setRecentPredictValue] = useState(null);
  const [recenttempValue, setRecentTempValue] = useState(null)

  const convertedObject = recentPredictValue
    ? recentPredictValue.split(",").reduce((acc, value, index) => {
      acc[labels[index]] = Number(value);
      return acc;
    }, {})
    : {};

  const controls = {
    zoom: true,
    pan: true,
    toolbar: true
  };

  useEffect(() => {
    if (!URL) return;
    const fetchData = async () => {
      try {
        const res = await fetch(URL);
        const data = await res.json();
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

        }
      } catch (err) {
        console.error("ThingSpeak fetch error:", err);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);

  }, []);

  const splitEightheenBands = fieldOne?.["y-axis"] || [];

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

  const colorMap = {
    "Eye Redness": "bg-red-500",
    "Tear Film": "bg-blue-500",
    "Blood Perfusion": "bg-green-500",
    "Oxygenation": "bg-yellow-500",
    "Tissue": "bg-purple-500",
    "Hydration": "bg-pink-500",
  };

  const channelSeries = (channelIndex, channelName) => ({
    "x-axis": fieldOne["x-axis"],
    "y-axis": splitEightheenBands.filter((_, i) => i % 18 === channelIndex),
    color: channelColors[channelName],
    seriesName: channelName
  });

  if (!fieldOne || !fieldTwo) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="mx-auto space-y-10 md:px-10 px-2 mb-10">

      {/* ================= BAND WISE GROUP VIEW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {labels.map((label) => (
          <div
            key={label}
            className={`
        p-5 rounded-2xl border-l-8 ${colorMap[label]}        
        shadow-lg hover:shadow-2xl
        transform hover:-translate-y-1 transition-all duration-300
      `}
          >

            <p className="text-2xl sm:text-3xl font-bold text-white">
              {label}
            </p>

            {/* Value */}
            <p className="
        mt-3 font-extrabold 
        text-2xl sm:text-3xl md:text-4xl lg:text-5xl
        text-white">
              {convertedObject?.[label] ?? "--"}
            </p>
          </div>
        ))}
      </div>

      <div
        className="
    p-6 rounded-2xl 
    bg-gradient-to-br from-red-600 to-orange-500
    shadow-lg hover:shadow-2xl
    transform hover:-translate-y-1 transition-all duration-300
    text-white
    w-full max-w-sm
  "
      >
        {/* Title */}
        <p className="text-2xl sm:text-3xl font-bold text-white">
          Temperature
        </p>

        {/* Value */}
        <p className="
    mt-3 font-extrabold
    text-3xl sm:text-4xl md:text-5xl lg:text-6xl
    leading-none
  ">
          {recenttempValue ?? "--"}°C
        </p>

        {/* Status */}
        <p className="mt-2 text-sm opacity-80">
          Live Sensor Data
        </p>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">
            Tear film / surface scatter
          </h3>
          <LiveChart
            data={[
              channelSeries(0, "A"),
              channelSeries(1, "B"),
              channelSeries(2, "C")
            ]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">
            Blood perfusion
          </h3>
          <LiveChart
            data={[
              channelSeries(3, "D"),
              channelSeries(4, "E"),
              channelSeries(5, "F"),
              channelSeries(6, "G")
            ]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">
            Eye redness / hemoglobin
          </h3>
          <LiveChart
            data={[
              channelSeries(7, "H"),
              channelSeries(8, "R"),
              channelSeries(9, "I")
            ]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">
            Blood volume
          </h3>
          <LiveChart
            data={[
              channelSeries(10, "S"),
              channelSeries(11, "J")
            ]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">
            Tissue penetration
          </h3>
          <LiveChart
            data={[
              channelSeries(12, "T"),
              channelSeries(13, "U"),
              channelSeries(14, "V")
            ]}
            chartType="line"
            lineStyle="straight"
            lineWidth={2}
            controls={controls}
          />
        </div>

        <div className="w-full bg-white rounded-2xl p-4 shadow">
          <h3 className="text-center font-semibold text-primary-600 mb-3">
            Water hydration
          </h3>
          <LiveChart
            data={[
              channelSeries(15, "W"),
              channelSeries(16, "K"),
              channelSeries(17, "L")
            ]}
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
