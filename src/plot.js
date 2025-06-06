import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'; // Alterado: Importado de CDN

// Helper function to get dimensions
function getSvgDimensions(svgId) {
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) { // Check if SVG exists
        console.warn(`SVG with ID ${svgId} not found.`);
        return { width: 0, height: 0, margin: { left: 0, right: 0, top: 0, bottom: 0 } };
    }
    const width = +svg.style("width").split("px")[0];
    const height = +svg.style("height").split("px")[0];
    const margens = { left: 50, right: 25, top: 25, bottom: 50 }; // Default margins
    return { width, height, margens };
}

// Existing chart, renamed and adapted for specific SVG ID
export async function loadTripDistanceTipAmountChart(data) {
    const svgId = 'tripTipChart';
    const { width, height, margens } = getSvgDimensions(svgId);
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) return;

    // Clear previous elements from this specific chart
    svg.selectAll('*').remove();

    // ---- Escalas
    const distExtent = d3.extent(data, d => d.trip_distance);
    const mapX = d3.scaleLinear().domain(distExtent).range([0, width - margens.left - margens.right]);

    const tipExtent = d3.extent(data, d => d.tip_amount);
    const mapY = d3.scaleLinear().domain(tipExtent).range([height - margens.bottom - margens.top, 0]);

    // ---- Eixos
    const xAxis  = d3.axisBottom(mapX);
    svg.append('g')
        .attr('id', `axisX-${svgId}`) // Unique ID for axis
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    const yAxis  = d3.axisLeft(mapY);
    svg.append('g')
        .attr('id', `axisY-${svgId}`) // Unique ID for axis
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    // Eixo X Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margens.left + (width - margens.left - margens.right) / 2)
        .attr("y", height - margens.bottom / 2 + 10)
        .style("text-anchor", "middle")
        .text("Distância da Viagem");

    // Eixo Y Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${margens.left / 2 - 10})`)
        .style("text-anchor", "middle")
        .text("Valor da Gorjeta");


    // ---- Círculos
    const cGroup = svg.append('g')
            .attr('id', `group-${svgId}`) // Unique ID for group
            .attr('transform', `translate(${margens.left}, ${margens.top})`);

    cGroup.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => mapX(d.trip_distance))
        .attr('cy', d => mapY(d.tip_amount))
        .attr('r', 4);
}

// New chart for Question 1: Weekday vs. Weekend
export async function loadWeekdayWeekendChart(data) {
    const svgId = 'weekdayWeekendChart';
    const { width, height, margens } = getSvgDimensions(svgId);
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) return;

    svg.selectAll('*').remove();

    // Data processing
    const processedData = data.map(d => {
        const dayOfWeek = d.pickup_day_of_week; // Already an integer 0-6
        const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? "Fim de Semana" : "Dia de Semana";
        return { ...d, dayType };
    });

    const dayTypeCounts = d3.rollups(processedData, v => v.length, d => d.dayType)
        .map(([key, value]) => ({ dayType: key, count: value }));

    // Sort for consistent display
    dayTypeCounts.sort((a, b) => {
        if (a.dayType === "Dia de Semana" && b.dayType === "Fim de Semana") return -1;
        if (a.dayType === "Fim de Semana" && b.dayType === "Dia de Semana") return 1;
        return 0;
    });

    // Scales
    const mapX = d3.scaleBand()
        .domain(dayTypeCounts.map(d => d.dayType))
        .range([0, width - margens.left - margens.right])
        .padding(0.1);

    const mapY = d3.scaleLinear()
        .domain([0, d3.max(dayTypeCounts, d => d.count) * 1.1]) // Add some padding to max
        .range([height - margens.bottom - margens.top, 0]);

    // Axes
    const xAxis = d3.axisBottom(mapX);
    svg.append('g')
        .attr('id', `axisX-${svgId}`)
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(mapY).ticks(5);
    svg.append('g')
        .attr('id', `axisY-${svgId}`)
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    // Eixo X Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margens.left + (width - margens.left - margens.right) / 2)
        .attr("y", height - margens.bottom / 2 + 10)
        .style("text-anchor", "middle")
        .text("Tipo de Dia");

    // Eixo Y Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${margens.left / 2 - 10})`)
        .style("text-anchor", "middle")
        .text("Número de Corridas");

    // Bars
    svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .selectAll('.bar')
        .data(dayTypeCounts)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => mapX(d.dayType))
        .attr('y', d => mapY(d.count))
        .attr('width', mapX.bandwidth())
        .attr('height', d => (height - margens.bottom - margens.top) - mapY(d.count));
}

// New chart for Question 2: Tip Amount vs. Time of Day
export async function loadTipAmountByTimeChart(data) {
    const svgId = 'tipTimeChart';
    const { width, height, margens } = getSvgDimensions(svgId);
    const svg = d3.select(`#${svgId}`);
    if (!svg.node()) return;

    svg.selectAll('*').remove();

    // Data processing
    const processedData = data.map(d => {
        const hour = d.pickup_hour; // Already an integer 0-23
        return { ...d, hour };
    });

    const tipAmountByHour = d3.rollups(processedData, v => d3.mean(v, d => d.tip_amount), d => d.hour)
        .map(([key, value]) => ({ hour: key, averageTip: value }));

    // Sort by hour
    tipAmountByHour.sort((a, b) => a.hour - b.hour);

    // Scales
    const mapX = d3.scaleLinear()
        .domain(d3.extent(tipAmountByHour, d => d.hour))
        .range([0, width - margens.left - margens.right]);

    const mapY = d3.scaleLinear()
        .domain([0, d3.max(tipAmountByHour, d => d.averageTip) * 1.1])
        .range([height - margens.bottom - margens.top, 0]);

    // Axes
    const xAxis = d3.axisBottom(mapX).tickFormat(d3.format("d")); // Integer hours
    svg.append('g')
        .attr('id', `axisX-${svgId}`)
        .attr('class', 'x axis')
        .attr('transform', `translate(${margens.left}, ${height - margens.bottom})`)
        .call(xAxis);

    const yAxis = d3.axisLeft(mapY).ticks(5);
    svg.append('g')
        .attr('id', `axisY-${svgId}`)
        .attr('class', 'y axis')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);

    // Eixo X Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", margens.left + (width - margens.left - margens.right) / 2)
        .attr("y", height - margens.bottom / 2 + 10)
        .style("text-anchor", "middle")
        .text("Hora do Dia (24h)");

    // Eixo Y Label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${margens.left / 2 - 10})`)
        .style("text-anchor", "middle")
        .text("Gorjeta Média");

    // Line
    const line = d3.line()
        .x(d => mapX(d.hour))
        .y(d => mapY(d.averageTip));

    svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .append('path')
        .datum(tipAmountByHour)
        .attr('fill', 'none')
        .attr('stroke', '#006A71')
        .attr('stroke-width', 2)
        .attr('d', line);

    // Points
    svg.append('g')
        .attr('transform', `translate(${margens.left}, ${margens.top})`)
        .selectAll('circle')
        .data(tipAmountByHour)
        .enter()
        .append('circle')
        .attr('cx', d => mapX(d.hour))
        .attr('cy', d => mapY(d.averageTip))
        .attr('r', 4)
        .attr('fill', '#9ACBD0')
        .attr('stroke', '#006A71')
        .attr('stroke-width', 1);
}

// Clear all charts
export function clearAllCharts() {
    d3.select('#tripTipChart').selectAll('*').remove();
    d3.select('#weekdayWeekendChart').selectAll('*').remove();
    d3.select('#tipTimeChart').selectAll('*').remove();
}