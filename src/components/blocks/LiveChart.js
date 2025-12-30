import React from 'react';
import ReactApexChart from 'react-apexcharts';

const CustomApexChart = ({ data, title, lineStyle, lineWidth, chartType, controls }) => {
    // Convert each data object into a series object expected by ApexCharts.
    const series = data.map((serie) => {
        // Get only the last 20 items from both x-axis and y-axis
        const last20X = serie["x-axis"]?.slice(-100);
        const last20Y = serie["y-axis"]?.slice(-100);
    
        // Ensure the data is sorted by x value (if not already)
        const seriesData = last20X?.map((x, i) => ({
            x,
            y: last20Y[i]
        })).sort((a, b) => new Date(a.x) - new Date(b.x));        
    
        return {
            name: serie.seriesName,
            data: seriesData,
            ...(serie.color && { color: serie.color })
        };
    });
    
    // Compute xMin and xMax from the first series (assuming all series are similar)
    const xMin = series[0]?.data[0]?.x;
    const xMax = series[0]?.data[series[0]?.data.length - 1]?.x;
    
    // Chart configuration options with dynamic x-axis range.
    const options = {
        chart: {
            height: 350,
            type: chartType,
            // Disable selection by default unless autoSelected is explicitly set to 'selection'
            selection: {
              enabled: false,
              type: "x"
            },
            zoom: {
                enabled: controls?.zoomEnabled !== undefined ? controls.zoomEnabled : true,
                type: controls?.zoomType || 'x',
                autoScaleYaxis: controls?.autoScaleYaxis !== undefined ? controls.autoScaleYaxis : true
            },
            toolbar: {
                show: controls?.show !== undefined ? controls.show : true,
                tools: {
                    download: controls?.download !== undefined ? controls.download : true,
                    selection: controls?.selection !== undefined ? controls.selection : false,
                    zoom: controls?.zoom !== undefined ? controls.zoom : true,
                    zoomin: controls?.zoomin !== undefined ? controls.zoomin : true,
                    zoomout: controls?.zoomout !== undefined ? controls.zoomout : true,
                    pan: controls?.pan !== undefined ? controls.pan : true,
                    reset: controls?.reset !== undefined ? controls.reset : true
                },
                // autoSelected: controls?.autoSelected || 'zoom'
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: lineStyle,
            width: lineWidth
        },
        title: {
            text: title,
            align: 'left'
        },
        grid: {
            row: {
                colors: title === "Heart rate" ? ['transparent', 'transparent'] : ['#f3f3f3', '#fff'],
                opacity: 0.5
            }
        },
        xaxis: {
            type: 'datetime',
            tickAmount: 20,
            labels: {
                formatter: (value) => new Date(value).toLocaleString(),
                rotate: -45
            },
            min: xMin,
            max: xMax
        }
    };

    const containerStyle = {
        width: "100%",
        height: 350,
        position: "relative",
        // This creates a 20px x 20px grid with 1px gray lines
        backgroundImage: `
          linear-gradient(rgba(247, 23, 53, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(247, 23, 53, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: "10px 10px"
    }

    return (
        <div>
            <div id="chart">
                <ReactApexChart key={chartType} options={options} series={series} height={350} type={chartType} width={"100%"} style={title === "Heart rate" ? containerStyle : {}}/>
            </div>
            <div id="html-dist"></div>
        </div>
    );
};

export default CustomApexChart;