import React, { useState, useEffect, useMemo } from "react";
import LiveChart from "../blocks/LiveChart";
import { URL } from "../../utils/Range";

function Home() {

  // ===============================
  // STATE
  // ===============================
  const [fieldOne, setFieldOne] = useState(null);
  const [fieldTwo, setFieldTwo] = useState(null);

  // ===============================
  // CHART CONTROLS
  // ===============================
  const controls = {
    zoom: true,
    pan: true,
    toolbar: true
  };

  // ===============================
  // HELPERS
  // ===============================
  const chunkArray = (arr, size = 17) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const bandConfig = [
    { band: "Blue Band", channels: ["A", "B", "C"], start: 0, end: 2 },
    { band: "Green Band", channels: ["D", "E", "F", "G"], start: 2, end: 6 },
    { band: "Red Band", channels: ["H", "R", "I"], start: 6, end: 9 },
    { band: "Deep Red", channels: ["S", "J"], start: 9, end: 11 },
    { band: "NIR-1", channels: ["T", "U", "V"], start: 11, end: 14 },
    { band: "NIR-2", channels: ["W", "K", "L"], start: 14, end: 17 }
  ];

  const mapEvery18ToBandObjects = (values = []) => {
    const chunks = chunkArray(values, 17);

    return chunks.map((chunk, feedIndex) => ({
      feedIndex: feedIndex + 1,
      bands: bandConfig.flatMap(cfg =>
        chunk.slice(cfg.start, cfg.end).map((value, idx) => ({
          band: cfg.band,
          channel: cfg.channels[idx],
          value
        }))
      )
    }));
  };

  // ===============================
  // FETCH FROM THINGSPEAK
  // ===============================
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
        }
      } catch (err) {
        console.error("ThingSpeak fetch error:", err);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);

  }, []);

  // ===============================
  // DATA PROCESSING
  // ===============================
  const splitEightheenBands = fieldOne?.["y-axis"] || [];

  const bandWiseArrayObjects = useMemo(
    () => mapEvery18ToBandObjects(splitEightheenBands),
    [splitEightheenBands]
  );

  // 🔹 Group latest feed by band
  const groupedBands = useMemo(() => {
    if (!bandWiseArrayObjects.length) return {};
    const latest = bandWiseArrayObjects[bandWiseArrayObjects.length - 1];
    return latest.bands.reduce((acc, item) => {
      if(!acc[item.band]) acc[item.band] = [];
      acc[item.band].push({
        channel: item.channel,
        value: item.value
      });
      return acc;
    }, {});
  }, [bandWiseArrayObjects]);


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


  const channelSeries = (channelIndex, channelName) => ({
    "x-axis": fieldOne["x-axis"],
    "y-axis": splitEightheenBands.filter((_, i) => i % 17 === channelIndex),
    color: channelColors[channelName],
    seriesName: channelName
  });



  if (!fieldOne || !fieldTwo) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="mx-auto space-y-10 md:px-10 px-2 mb-10">

      {/* ================= BAND WISE GROUP VIEW ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(groupedBands).map(([bandName, values]) => (
          <div
            key={bandName}
            className="bg-white p-4 rounded-2xl shadow-md"
          >
            <h3 className="text-center text-primary-600 font-semibold mb-3">
              {bandName}
            </h3>

            <div className="flex justify-around gap-4">
              {values.map((v, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center bg-gray-50 px-4 py-2 rounded-xl"
                >
                  <span className="text-sm text-gray-500">
                    {v.channel}
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {v.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
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
