// ============================================
// 그래프 관련 공통 설정 및 유틸리티
// ============================================

// 전역 차트 인스턴스 저장소
const CHART_INSTANCES = {};

// CSS 변수에서 색상 가져오기 유틸리티 함수
function getCSSVariable(variableName, fallback = null) {
	if (typeof document === 'undefined') return fallback;
	const value = getComputedStyle(document.body).getPropertyValue(variableName).trim();
	return value || fallback;
}

// CSS 변수에서 그래프 색상 가져오기 함수들
function getChartColor(colorType) {
	const colorMap = {
		PRIMARY: '--chart-primary',
		SECONDARY: '--chart-secondary',
		TERTIARY: '--chart-tertiary',
		DANGER: '--chart-danger',
		WARNING: '--chart-warning',
		SUCCESS: '--chart-success',
		INFO: '--chart-info'
	};
	
	const fallbackMap = {
		PRIMARY: 'rgba(54, 162, 235, 1)',
		SECONDARY: 'rgba(75, 192, 192, 1)',
		TERTIARY: 'rgba(153, 102, 255, 1)',
		DANGER: 'rgba(255, 99, 132, 1)',
		WARNING: 'rgba(255, 159, 64, 1)',
		SUCCESS: 'rgba(75, 192, 192, 1)',
		INFO: 'rgba(54, 162, 235, 1)'
	};
	
	const cssVar = colorMap[colorType];
	const fallback = fallbackMap[colorType];
	
	if (!cssVar) return fallback;
	
	return getCSSVariable(cssVar, fallback);
}

// 전역으로 노출 (common.js에서 사용)
window.getChartColor = getChartColor;

// 동적으로 색상 팔레트 생성
function getChartColors() {
	return {
		PRIMARY: getChartColor('PRIMARY'),
		SECONDARY: getChartColor('SECONDARY'),
		TERTIARY: getChartColor('TERTIARY'),
		DANGER: getChartColor('DANGER'),
		WARNING: getChartColor('WARNING'),
		SUCCESS: getChartColor('SUCCESS'),
		INFO: getChartColor('INFO')
	};
}

// 공통 상수
const CHART_CONSTANTS = {
	// 시간 레이블 (12시간)
	LABELS: ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
	
	// 기본 색상 팔레트 (동적으로 생성)
	get COLORS() {
		return getChartColors();
	},
	
	// 기본 차트 옵션
	DEFAULT_OPTIONS: {
		responsive: true,
		maintainAspectRatio: false,
		aspectRatio: 2.5,
		interaction: {
			mode: 'index',
			intersect: false
		}
	}
};

// 메인 색상 가져오기
function getMainColor() {
	return (window.getMainColor ? window.getMainColor() : getChartColor('PRIMARY'));
}

// 공통 옵션 생성 함수들
const ChartOptions = {
	// 기본 툴팁 옵션
	tooltip: (unit = '건', customLabel = null) => ({
		enabled: true,
		mode: 'index',
		intersect: false,
		backgroundColor: 'rgba(0, 0, 0, 0.9)',
		titleColor: '#ffffff',
		bodyColor: '#ffffff',
		borderColor: 'rgba(255, 255, 255, 0.3)',
		borderWidth: 1,
		cornerRadius: 8,
		displayColors: true,
		titleFont: { size: 12, weight: 'bold' },
		bodyFont: { size: 11 },
		padding: 12,
		callbacks: {
			title: (context) => '시간: ' + context[0].label + '시',
			label: (context) => {
				if (customLabel) return customLabel(context);
				const label = context.dataset.label || '';
				const value = context.parsed.y;
				if (context.dataset.label === '트래픽' || unit === 'K') {
					return label + ': ' + value + 'K';
				}
				return label + ': ' + value + unit;
			}
		}
	}),
	
	// 범례 옵션
	legend: (display = true, position = 'bottom', fontSize = 12) => ({
		display,
		position,
		labels: {
			color: '#ffffff',
			font: { size: fontSize },
			usePointStyle: true,
			pointStyle: 'circle',
			boxWidth: 6,
			boxHeight: 6,
			padding: position === 'bottom' ? 12 : 8
		}
	}),
	
	// X축 스케일
	scaleX: (fontSize = 11, showTicks = true) => ({
		display: true,
		grid: {
			color: 'rgba(160, 160, 160, 0.3)',
			drawBorder: false
		},
		ticks: {
			color: '#ffffff',
			font: { size: fontSize },
			display: showTicks
		}
	}),
	
	// Y축 스케일
	scaleY: (showTicks = false, min = null, max = null, beginAtZero = false) => ({
		display: true,
		...(min !== null && { min }),
		...(max !== null && { max }),
		...(beginAtZero && { beginAtZero: true }),
		grid: {
			color: 'rgba(160, 160, 160, 0.3)',
			drawBorder: false
		},
		ticks: {
			display: showTicks
		}
	}),
	
	// 레이아웃 패딩
	layout: (bottom = 10) => ({
		padding: { bottom }
	})
};

// 차트 인스턴스 저장 헬퍼
function saveChartInstance(key, chartInstance) {
	if (chartInstance) {
		CHART_INSTANCES[key] = chartInstance;
	}
	return chartInstance;
}

// 차트 인스턴스 제거 헬퍼
function destroyChartInstance(key) {
	if (CHART_INSTANCES[key]) {
		CHART_INSTANCES[key].destroy();
		delete CHART_INSTANCES[key];
	}
}

// 선 그래프 데이터셋 생성 헬퍼
function createLineDataset(label, data, color, options = {}) {
	const mainColor = getMainColor();
	const defaultColor = color || mainColor;
	
	return {
		label,
		data,
		borderColor: defaultColor,
		backgroundColor: defaultColor.replace('1)', '0.2)'),
		tension: 0.4,
		fill: options.fill !== false,
		pointBackgroundColor: defaultColor,
		pointBorderColor: defaultColor,
		pointBorderWidth: options.pointBorderWidth || 0,
		pointRadius: options.pointRadius || 2,
		pointHoverRadius: options.pointHoverRadius || 2,
		...options
	};
}

// 막대 그래프 데이터셋 생성 헬퍼
function createBarDataset(label, data, color, options = {}) {
	return {
		label,
		data,
		backgroundColor: color.replace('1)', '0.8)'),
		borderColor: color,
		borderWidth: 1,
		...options
	};
}

// ============================================
// 선 그래프 (Line Charts)
// ============================================

// 다중 선 그래프 생성 (범용)
function createMultiLineChart(elementId, datasets, options = {}) {
	const chartElement = document.getElementById(elementId);
	if (!chartElement) {
		console.warn(elementId + ' element not found, skipping chart creation');
		return null;
	}
	
	// 기존 차트가 있으면 제거
	if (CHART_INSTANCES[elementId]) {
		destroyChartInstance(elementId);
	}
	
	const ctx = chartElement.getContext('2d');
	const chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: options.labels || CHART_CONSTANTS.LABELS,
			datasets: datasets
		},
		options: {
			...CHART_CONSTANTS.DEFAULT_OPTIONS,
			layout: ChartOptions.layout(options.paddingBottom || 10),
			plugins: {
				legend: ChartOptions.legend(options.showLegend !== false, options.legendPosition || 'bottom', options.legendFontSize || 12),
				tooltip: ChartOptions.tooltip(options.unit || '건', options.customLabel)
			},
			scales: {
				x: ChartOptions.scaleX(options.xFontSize || 11, options.showXTicks !== false),
				y: ChartOptions.scaleY(options.showYTicks === true, options.yMin, options.yMax, options.beginAtZero)
			},
			elements: {
				line: { borderWidth: 1 }
			},
			...options.chartOptions
		}
	});
	
	return saveChartInstance(elementId, chart);
}

// 트래픽 선 그래프
function createTrafficChart(elementId, trafficData) {
	return saveChartInstance(elementId, createMultiLineChart(elementId, [
		createLineDataset('트래픽', trafficData, CHART_CONSTANTS.COLORS.SECONDARY)
	], {
		showLegend: false,
		unit: 'K',
		customLabel: (context) => context.dataset.label + ': ' + context.parsed.y + 'K'
	}));
}

// 사용자 접속 현황 그래프
function createSystemAccessChart(elementId) {
	const datasets = [
		createLineDataset('접속자 수', [1983, 1850, 1920, 2100, 2080, 1983, 1950, 2000, 1900, 2050, 1980, 2020], getMainColor()),
		createLineDataset('접속 차단 수', [45, 38, 52, 41, 48, 45, 42, 39, 44, 47, 43, 46], CHART_CONSTANTS.COLORS.DANGER),
		createLineDataset('트래픽', [452, 420, 480, 500, 480, 452, 440, 460, 450, 470, 460, 465], CHART_CONSTANTS.COLORS.SECONDARY)
	];
	
	return createMultiLineChart(elementId, datasets, {
		showLegend: false,
		paddingBottom: 30,
		customLabel: (context) => {
			if (context.dataset.label === '트래픽') {
				return context.dataset.label + ': ' + context.parsed.y + 'K';
			}
			return context.dataset.label + ': ' + context.parsed.y + '건';
		}
	});
}

// VPN 외부접속자 현황 그래프
function createExternalAccessChart(elementId) {
	const datasets = [
		createLineDataset('접속자 수', [1211, 1150, 1180, 1250, 1220, 1211, 1190, 1200, 1180, 1230, 1200, 1215], getMainColor()),
		createLineDataset('접속 차단 수', [32, 28, 35, 30, 25, 32, 29, 33, 27, 31, 34, 30], CHART_CONSTANTS.COLORS.DANGER),
		createLineDataset('트래픽', [442, 420, 450, 480, 460, 442, 430, 440, 435, 445, 440, 442], CHART_CONSTANTS.COLORS.SECONDARY)
	];
	
	return createMultiLineChart(elementId, datasets, {
		showLegend: false,
		paddingBottom: 30,
		customLabel: (context) => {
			if (context.dataset.label === '트래픽') {
				return context.dataset.label + ': ' + context.parsed.y + 'K';
			}
			return context.dataset.label + ': ' + context.parsed.y + '건';
		}
	});
}

// 사이트 접속 현황 그래프
function createMalwareBlockChart(elementId) {
	const datasets = [
		createLineDataset('전체', [1200, 800, 1500, 600, 1800, 900, 1400, 700, 1600, 1000, 1300, 1100], getMainColor()),
		createLineDataset('http', [480, 320, 600, 240, 720, 360, 560, 280, 640, 400, 520, 440], CHART_CONSTANTS.COLORS.SECONDARY),
		createLineDataset('SSL', [720, 480, 900, 360, 1080, 540, 840, 420, 960, 600, 780, 660], CHART_CONSTANTS.COLORS.TERTIARY)
	];
	
	return createMultiLineChart(elementId, datasets, {
		showLegend: true,
		paddingBottom: 0,
		unit: 'bps',
		customLabel: (context) => context.dataset.label + ': ' + context.parsed.y + 'bps'
	});
}

// 정보유출 감시 현황 그래프
function createHarmfulBlockSystemChart(elementId) {
	const datasets = [
		createLineDataset('전체', [1800, 1850, 1920, 1983, 1950, 1900, 1880, 1850, 1820, 1800, 1780, 1750], getMainColor(), {
			fill: false,
			pointBorderWidth: 2,
			pointRadius: 4,
			pointHoverRadius: 6
		}),
		createLineDataset('웹', [1400, 1440, 1500, 1543, 1520, 1480, 1460, 1440, 1420, 1400, 1380, 1360], CHART_CONSTANTS.COLORS.SECONDARY, {
			fill: false,
			pointBorderWidth: 2,
			pointRadius: 4,
			pointHoverRadius: 6
		}),
		createLineDataset('앱', [400, 410, 420, 440, 430, 420, 420, 410, 400, 400, 400, 390], CHART_CONSTANTS.COLORS.DANGER, {
			fill: false,
			pointBorderWidth: 2,
			pointRadius: 4,
			pointHoverRadius: 6
		})
	];
	
	return createMultiLineChart(elementId, datasets, {
		showLegend: true,
		legendPosition: 'top',
		legendFontSize: 12,
		showYTicks: true,
		customLabel: (context) => context.dataset.label + ': ' + context.parsed.y.toLocaleString() + '건',
		chartOptions: {
			interaction: {
				intersect: false,
				mode: 'index'
			}
		}
	});
}

// ============================================
// 막대 그래프 (Bar Charts)
// ============================================

// 누적 막대 그래프 생성
function createStackedBarChart(elementId, datasets, options = {}) {
	const chartElement = document.getElementById(elementId);
	if (!chartElement) {
		console.warn(elementId + ' element not found, skipping chart creation');
		return null;
	}
	
	// 기존 차트가 있으면 제거
	if (CHART_INSTANCES[elementId]) {
		destroyChartInstance(elementId);
	}
	
	const ctx = chartElement.getContext('2d');
	const chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: options.labels || CHART_CONSTANTS.LABELS,
			datasets: datasets
		},
		options: {
			...CHART_CONSTANTS.DEFAULT_OPTIONS,
			layout: ChartOptions.layout(options.paddingBottom || 0),
			plugins: {
				legend: ChartOptions.legend(options.showLegend !== false, options.legendPosition || 'bottom', options.legendFontSize || 12),
				tooltip: ChartOptions.tooltip(options.unit || '건', options.customLabel)
			},
			scales: {
				x: {
					...ChartOptions.scaleX(options.xFontSize || 11, options.showXTicks !== false),
					...(options.stacked && { stacked: true }),
					...(options.barPercentage !== undefined && { barPercentage: options.barPercentage })
				},
				y: {
					...ChartOptions.scaleY(options.showYTicks === true, options.yMin, options.yMax, options.beginAtZero !== false),
					...(options.stacked && { stacked: true })
				}
			},
			...options.chartOptions
		}
	});
	
	return saveChartInstance(elementId, chart);
}

// SWG 누적 막대 그래프
function createSwgStackedBarChart(elementId) {
	const datasets = [
		createBarDataset('접속', [173, 165, 180, 195, 188, 175, 170, 165, 160, 175, 180, 185], getMainColor()),
		createBarDataset('차단', [8, 5, 12, 6, 10, 7, 9, 6, 11, 8, 9, 7], CHART_CONSTANTS.COLORS.DANGER)
	];
	
	return createStackedBarChart(elementId, datasets, {
		stacked: true,
		barPercentage: 0.25,
		showLegend: true
	});
}

// 정보유출 감시 현황 막대 그래프
function createBarChart(elementId, data1, data2, label1, label2) {
	const datasets = [
		createBarDataset(label1, data1, getMainColor()), // 전체: PRIMARY 색상
		createBarDataset(label2, data2, CHART_CONSTANTS.COLORS.SECONDARY) // 개인정보: SECONDARY 색상
	];
	
	return createStackedBarChart(elementId, datasets, {
		stacked: true,
		barPercentage: 0.25,
		showLegend: true
	});
}

// ============================================
// 혼합형 그래프 (Mixed Charts)
// ============================================

// 혼합형 그래프 (막대 + 선)
function createMixedChart(elementId, lineData, barData1, barData2, label1, label2, label3) {
	const chartElement = document.getElementById(elementId);
	if (!chartElement) {
		console.warn(elementId + ' element not found, skipping chart creation');
		return null;
	}
	
	// 기존 차트가 있으면 제거
	if (CHART_INSTANCES[elementId]) {
		destroyChartInstance(elementId);
	}
	
	const ctx = chartElement.getContext('2d');
	const datasets = [
		{
			...createLineDataset(label1, lineData, getMainColor(), {
				fill: false,
				pointRadius: 3,
				pointHoverRadius: 5
			}),
			type: 'line'
		},
		{
			...createBarDataset(label2, barData1, CHART_CONSTANTS.COLORS.SECONDARY),
			type: 'bar'
		}
	];
	
	// label3와 barData2가 있으면 추가
	if (label3 && barData2) {
		datasets.push({
			...createBarDataset(label3, barData2, CHART_CONSTANTS.COLORS.TERTIARY),
			type: 'bar'
		});
	}
	
	const chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: CHART_CONSTANTS.LABELS,
			datasets: datasets
		},
		options: {
			...CHART_CONSTANTS.DEFAULT_OPTIONS,
			layout: ChartOptions.layout(20),
			plugins: {
				legend: ChartOptions.legend(true, 'bottom', 12),
				tooltip: ChartOptions.tooltip('건')
			},
			scales: {
				x: {
					...ChartOptions.scaleX(11, true),
					barPercentage: 0.5
				},
				y: {
					...ChartOptions.scaleY(false, null, null, true)
				}
			}
		}
	});
	
	return saveChartInstance(elementId, chart);
}

// ============================================
// 원형 그래프 (Doughnut/Pie Charts)
// ============================================

// 원형 그래프 생성 (범용)
function createDoughnutChart(elementId, data, labels, options = {}) {
	const chartElement = document.getElementById(elementId);
	if (!chartElement) {
		console.warn(elementId + ' element not found, skipping chart creation');
		return null;
	}
	
	// 기존 차트가 있으면 제거
	if (CHART_INSTANCES[elementId]) {
		destroyChartInstance(elementId);
	}
	
	const ctx = chartElement.getContext('2d');
	const backgroundColor = options.colors || [
		CHART_CONSTANTS.COLORS.PRIMARY,
		CHART_CONSTANTS.COLORS.SECONDARY,
		CHART_CONSTANTS.COLORS.TERTIARY,
		CHART_CONSTANTS.COLORS.DANGER,
		CHART_CONSTANTS.COLORS.WARNING
	];
	
	const chart = new Chart(ctx, {
		type: 'doughnut',
		data: {
			labels: labels,
			datasets: [{
				data: data,
				backgroundColor: backgroundColor,
				borderColor: options.borderColor || 'rgba(255, 255, 255, 0.1)',
				borderWidth: options.borderWidth || 2,
				hoverOffset: 4
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: options.maintainAspectRatio !== false,
			cutout: options.cutout || '70%',
			plugins: {
				legend: ChartOptions.legend(
					options.showLegend !== false,
					options.legendPosition || 'right',
					options.legendFontSize || 12
				),
				tooltip: {
					...ChartOptions.tooltip(options.unit || '건'),
					callbacks: {
						label: (context) => {
							const label = context.label || '';
							const value = context.parsed;
							return label + ': ' + value + (options.unit || '건');
						}
					}
				}
			},
			animation: {
				animateRotate: true,
				animateScale: true,
				duration: 2000,
				easing: 'easeOutQuart'
			}
		}
	});
	
	return saveChartInstance(elementId, chart);
}

// 접속/차단 원형 그래프
function createPieChart(elementId, accessValue, blockValue) {
	return createDoughnutChart(elementId, [accessValue, blockValue], ['접속', '차단'], {
		colors: [
			getMainColor().replace('1)', '0.8)'),
			CHART_CONSTANTS.COLORS.DANGER.replace('1)', '0.8)')
		],
		borderColor: [
			getMainColor(),
			CHART_CONSTANTS.COLORS.DANGER
		],
		borderWidth: 0,
		cutout: '70%',
		legendPosition: 'right'
	});
}

// AI 사용량 원형 그래프
function createAITotalUsageChart() {
	const canvas = document.getElementById('aiTotalUsageChart');
	if (!canvas) {
		console.error('aiTotalUsageChart canvas element not found');
		return null;
	}
	
	const totalUsageData = [
		{ name: '메일', value: 20, color: '#36a2eb' },
		{ name: '메신저', value: 5, color: '#4bc0c0' },
		{ name: 'SNS', value: 12, color: '#9966ff' },
		{ name: '댓글', value: 3, color: '#ff9f40' },
		{ name: '업무공유', value: 8, color: '#ff6384' },
		{ name: '웹하드', value: 10, color: '#ffcd56' },
		{ name: 'FTP', value: 32, color: '#4bc0c0' },
		{ name: '생성형 AI', value: 10, color: '#c9cbcf' }
	];
	
	return createDoughnutChart('aiTotalUsageChart',
		totalUsageData.map(item => item.value),
		totalUsageData.map(item => item.name),
		{
			colors: totalUsageData.map(item => item.color),
			cutout: '80%',
			legendPosition: 'left',
			unit: '%'
		}
	);
}

// AI 플랫폼 사용량 원형 그래프
function createAIUsageChart() {
	const canvas = document.getElementById('aiUsageChart');
	if (!canvas) {
		console.error('aiUsageChart canvas element not found');
		return null;
	}
	
	const aiPlatforms = [
		{ name: 'ChatGPT', value: 35, color: '#36a2eb' },
		{ name: 'Claude', value: 25, color: '#4bc0c0' },
		{ name: 'Gemini', value: 20, color: '#9966ff' },
		{ name: 'Copilot', value: 15, color: '#ff9f40' },
		{ name: '기타', value: 5, color: '#ffcd56' }
	];
	
	return createDoughnutChart('aiUsageChart',
		aiPlatforms.map(platform => platform.value),
		aiPlatforms.map(platform => platform.name),
		{
			colors: aiPlatforms.map(platform => platform.color),
			cutout: '80%',
			legendPosition: 'right',
			unit: '%'
		}
	);
}

// ============================================
// 시스템 리소스 업데이트 관련
// ============================================

// 숫자 값 애니메이션
function animateValue(element, start, end, duration) {
	const startTime = performance.now();
	const difference = end - start;
	
	element.classList.add('updating');
	setTimeout(() => element.classList.remove('updating'), 500);
	
	function updateValue(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easeOutQuart = 1 - Math.pow(1 - progress, 4);
		const currentValue = start + (difference * easeOutQuart);
		
		element.textContent = Math.round(currentValue);
		
		if (progress < 1) {
			requestAnimationFrame(updateValue);
		}
	}
	
	requestAnimationFrame(updateValue);
}

// 메모리 값 애니메이션
function animateMemoryValue(element, start, end, duration) {
	const startTime = performance.now();
	const difference = end - start;
	
	element.classList.add('updating');
	setTimeout(() => element.classList.remove('updating'), 500);
	
	function updateValue(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easeOutQuart = 1 - Math.pow(1 - progress, 4);
		const currentValue = start + (difference * easeOutQuart);
		
		element.innerHTML = currentValue.toFixed(2) + 'G <span class="fw400">/ 7.61G</span>';
		
		if (progress < 1) {
			requestAnimationFrame(updateValue);
		}
	}
	
	requestAnimationFrame(updateValue);
}

// 프로그레스 바 애니메이션
function animateProgressBar(progressBar, targetWidth, duration, isCpuPacket = false) {
	const startTime = performance.now();
	const startWidth = parseFloat(progressBar.style.width) || 0;
	const difference = targetWidth - startWidth;
	
	// CSS 변수에서 프로그래스 바 색상 가져오기
	function getProgressColor(colorType) {
		const colorMap = {
			danger: '--progress-danger',
			warning: '--progress-warning',
			caution: '--progress-caution',
			normal: '--progress-normal'
		};
		
		const fallbackMap = {
			danger: '#d7091d',
			warning: '#ff6b6b',
			caution: '#a0b8d8',
			normal: '#b4c8e9'
		};
		
		const cssVar = colorMap[colorType];
		const fallback = fallbackMap[colorType];
		
		if (!cssVar) return fallback;
		
		return getCSSVariable(cssVar, fallback);
	}
	
	function updateProgress(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easeOutQuart = 1 - Math.pow(1 - progress, 4);
		const currentWidth = startWidth + (difference * easeOutQuart);
		
		progressBar.style.width = currentWidth + '%';
		
		// 색상 변화 효과 (CSS 변수 사용)
		if (isCpuPacket && currentWidth > 90) {
			progressBar.style.backgroundColor = getProgressColor('danger');
		} else if (currentWidth > 80) {
			progressBar.style.backgroundColor = getProgressColor('warning');
		} else if (currentWidth > 60) {
			progressBar.style.backgroundColor = getProgressColor('caution');
		} else {
			progressBar.style.backgroundColor = getProgressColor('normal');
		}
		
		if (progress < 1) {
			requestAnimationFrame(updateProgress);
		}
	}
	
	requestAnimationFrame(updateProgress);
}

// 선그래프 데이터 업데이트
function updateLineChartData(datasetLabel, newValue) {
	const trendChart = CHART_INSTANCES['trendChart'];
	if (!trendChart) {
		console.log('trendChart not available, skipping line chart data update');
		return;
	}
	
	const dataset = trendChart.data.datasets.find(ds => ds.label === datasetLabel);
	if (!dataset) return;
	
	// 마지막 데이터 포인트 업데이트
	if (dataset.data.length > 0) {
		dataset.data[dataset.data.length - 1] = newValue;
	} else {
		dataset.data.push(newValue);
	}
	
	// CPU 패킷이 90을 넘어가면 색상 변경
	if (datasetLabel === 'CPU') {
		if (newValue > 90) {
			const dangerColor = getCSSVariable('--progress-danger', '#d7091d');
			dataset.borderColor = dangerColor;
			dataset.backgroundColor = dangerColor.replace('1)', '0.2)').replace('#', 'rgba(');
			dataset.pointBackgroundColor = dangerColor;
			dataset.pointBorderColor = dangerColor;
		} else {
			const mainColor = getMainColor();
			dataset.borderColor = mainColor;
			dataset.backgroundColor = mainColor.replace('1)', '0.2)');
			dataset.pointBackgroundColor = mainColor;
			dataset.pointBorderColor = mainColor;
		}
		dataset.pointRadius = 2;
		dataset.pointHoverRadius = 2;
	}
	
	trendChart.update('active');
}

// 시스템 리소스 실시간 업데이트
function updateSystemResources() {
	// CPU 패킷
	const cpuPacketElement = document.querySelector('.chart-bg:nth-child(1) .fs200');
	const cpuPacketProgress = document.querySelector('.chart-bg:nth-child(1) .progress-bar');
	if (cpuPacketElement && cpuPacketProgress) {
		const currentValue = parseInt(cpuPacketElement.textContent);
		const newValue = Math.max(0, Math.min(100, currentValue + (Math.random() - 0.5) * 10));
		animateValue(cpuPacketElement, currentValue, newValue, 1000);
		animateProgressBar(cpuPacketProgress, newValue, 1000, true);
		updateLineChartData('CPU', newValue);
	}
	
	// CPU SSL
	const cpuSslElement = document.querySelector('.chart-bg:nth-child(2) .fs200');
	const cpuSslProgress = document.querySelector('.chart-bg:nth-child(2) .progress-bar');
	if (cpuSslElement && cpuSslProgress) {
		const currentValue = parseInt(cpuSslElement.textContent);
		const newValue = Math.max(0, Math.min(100, currentValue + (Math.random() - 0.5) * 8));
		animateValue(cpuSslElement, currentValue, newValue, 1000);
		animateProgressBar(cpuSslProgress, newValue, 1000);
	}
	
	// 메모리
	const memoryElement = document.querySelector('.chart-bg:nth-child(3) .fs200');
	const memoryProgress = document.querySelector('.chart-bg:nth-child(3) .progress-bar');
	if (memoryElement && memoryProgress) {
		const currentText = memoryElement.textContent;
		const currentValue = parseFloat(currentText.split('G')[0]);
		const newValue = Math.max(0, Math.min(7.61, currentValue + (Math.random() - 0.5) * 0.5));
		animateMemoryValue(memoryElement, currentValue, newValue, 1000);
		animateProgressBar(memoryProgress, (newValue / 7.61) * 100, 1000);
		updateLineChartData('MEM', (newValue / 7.61) * 100);
	}
	
	// HTTP 서비스
	const httpElement = document.querySelector('.chart-bg:nth-child(4) .fs200');
	const httpProgress = document.querySelector('.chart-bg:nth-child(4) .progress-bar');
	if (httpElement && httpProgress) {
		const currentValue = parseInt(httpElement.textContent);
		const newValue = Math.max(0, Math.min(100, currentValue + Math.floor((Math.random() - 0.3) * 5)));
		animateValue(httpElement, currentValue, newValue, 1000);
		animateProgressBar(httpProgress, newValue, 1000);
	}
	
	// HTTPS 서비스
	const httpsElement = document.querySelector('.chart-bg:nth-child(5) .fs200');
	const httpsProgress = document.querySelector('.chart-bg:nth-child(5) .progress-bar');
	if (httpsElement && httpsProgress) {
		const currentValue = parseInt(httpsElement.textContent);
		const newValue = Math.max(0, Math.min(100, currentValue + Math.floor((Math.random() - 0.3) * 5)));
		animateValue(httpsElement, currentValue, newValue, 1000);
		animateProgressBar(httpsProgress, newValue, 1000);
	}
	
	// HDD
	const hddValue = Math.max(0, Math.min(100, 20 + (Math.random() - 0.5) * 10));
	updateLineChartData('HDD', hddValue);
}

// ============================================
// 워드 클라우드
// ============================================

function createWordCloud() {
	const canvas = document.getElementById('wordCloud');
	if (!canvas) {
		console.error('wordCloud canvas element not found');
		return;
	}
	
	const container = canvas.parentElement;
	if (container) {
		canvas.width = container.offsetWidth || 400;
		canvas.height = container.offsetHeight || 300;
	} else {
		canvas.width = 400;
		canvas.height = 300;
	}
	
	const words = [
		['보고서', 50], ['이력서', 40], ['휴가추천', 25], ['설계도', 30],
		['주식추천', 45], ['스팸', 8], ['삼성전자전망', 25], ['AI추천주', 35],
		['수당', 20], ['코인시세', 30], ['주식동향', 15], ['금가격', 40],
		['암호화', 6], ['인증', 5], ['PPT', 4], ['연차', 3]
	];
	
	const colorMap = {
		'보고서': '#3b82f6', '설계도': '#2563eb', 'PPT': '#1d4ed8',
		'이력서': '#10b981', '휴가추천': '#059669', '연차': '#047857',
		'주식추천': '#f59e0b', 'AI추천주': '#d97706', '삼성전자전망': '#b45309',
		'주식동향': '#92400e', '금가격': '#78350f',
		'코인시세': '#8b5cf6', '수당': '#7c3aed',
		'스팸': '#ef4444', '암호화': '#dc2626', '인증': '#b91c1c'
	};
	
	const colorGroups = [
		['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
		['#10b981', '#059669', '#047857', '#065f46'],
		['#f59e0b', '#d97706', '#b45309', '#92400e'],
		['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
		['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
		['#06b6d4', '#0891b2', '#0e7490', '#155e75'],
		['#ec4899', '#db2777', '#be185d', '#9d174d'],
		['#eab308', '#ca8a04', '#a16207', '#854d0e']
	];
	
	const options = {
		list: words,
		weightFactor: 4,
		fontFamily: 'Pretendard, sans-serif',
		color: function(word, weight) {
			if (colorMap[word]) return colorMap[word];
			
			let hash = 0;
			for (let i = 0; i < word.length; i++) {
				hash = word.charCodeAt(i) + ((hash << 5) - hash);
			}
			const groupIndex = Math.abs(hash) % colorGroups.length;
			const selectedGroup = colorGroups[groupIndex];
			const colorIndex = Math.min(Math.floor(weight / 10), selectedGroup.length - 1);
			return selectedGroup[colorIndex];
		},
		rotateRatio: 0.3,
		rotationAngles: [0, 90],
		backgroundColor: 'transparent',
		gridSize: 8,
		drawOutOfBound: false,
		shrinkToFit: true,
		minSize: 6,
		maxSize: 60
	};
	
	try {
		if (typeof WordCloud !== 'undefined') {
			WordCloud(canvas, options);
			
			canvas.addEventListener('mousemove', () => {
				canvas.style.cursor = 'pointer';
			});
			
			canvas.addEventListener('click', () => {
				setTimeout(() => WordCloud(canvas, options), 100);
			});
		} else {
			console.error('WordCloud library not loaded');
		}
	} catch (error) {
		console.error('Error creating word cloud:', error);
	}
}

function initWordCloud() {
	if (typeof WordCloud !== 'undefined') {
		createWordCloud();
	} else {
		setTimeout(initWordCloud, 500);
	}
}

// ============================================
// 차트 초기화 및 제거 함수
// ============================================

// 모든 차트 제거
function destroyCharts() {
	Object.keys(CHART_INSTANCES).forEach(key => {
		destroyChartInstance(key);
	});
}

// 모든 차트 초기화
function initCharts() {
	// 기존 차트 제거
	destroyCharts();
	
	if (typeof Chart === 'undefined') {
		console.warn('Chart.js not loaded, skipping chart initialization');
		return;
	}
	
	try {
		// Trend Chart 초기화
		const trendChartElement = document.getElementById('trendChart');
		if (trendChartElement) {
			const ctx = trendChartElement.getContext('2d');
			const cpuData = [21, 26, 23, 67, 78, 89, 45, 52, 38, 41, 35, 42];
			const memoryData = [46, 56, 78, 64, 55, 55, 48, 52, 45, 38, 42, 39];
			const diskData = [12, 14, 11, 14, 21, 24, 18, 16, 19, 22, 17, 20];
			
			const trendChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: CHART_CONSTANTS.LABELS,
					datasets: [
						createLineDataset('CPU', cpuData, getMainColor()),
						createLineDataset('MEM', memoryData, CHART_CONSTANTS.COLORS.SECONDARY),
						createLineDataset('HDD', diskData, CHART_CONSTANTS.COLORS.TERTIARY)
					]
				},
				options: {
					...CHART_CONSTANTS.DEFAULT_OPTIONS,
					layout: ChartOptions.layout(10),
					plugins: {
						legend: ChartOptions.legend(true, 'bottom', 12),
						tooltip: ChartOptions.tooltip('%')
					},
					scales: {
						x: ChartOptions.scaleX(10, true),
						y: ChartOptions.scaleY(false, 0, 100)
					},
					elements: { line: { borderWidth: 1 } }
				}
			});
			
			saveChartInstance('trendChart', trendChart);
		}
		
		// IAM 차트
		createPieChart('iamPieChart', 1983, 45);
		createTrafficChart('iamTrafficChart', [1425, 1438, 1465, 1475, 1505, 1518, 1345, 1348, 1385, 1386, 1245, 1278]);
		
		// ZTNA 차트
		createPieChart('ztnaPieChart', 1583, 1131);
		createTrafficChart('ztnaTrafficChart', [442, 450, 480, 460, 442, 430, 440, 435, 445, 440, 442, 1000]);
		
		// SWG 차트
		createSwgStackedBarChart('swgBlockChart');
		
		// 사용자 접속 현황
		createSystemAccessChart('iamBlockChart');
		createSystemAccessChart('accessChart');
		createSystemAccessChart('dashboardAccessChart');
		
		// VPN 외부접속자 현황
		createExternalAccessChart('blockChart');
		createExternalAccessChart('dashboardExternalChart');
		
		// 시스템 트래픽 현황 (범례 포함) - ztnaBlockChart
		const ztnaBlockChartElement = document.getElementById('ztnaBlockChart');
		if (ztnaBlockChartElement) {
			const ctx = ztnaBlockChartElement.getContext('2d');
			const datasets = [
				createLineDataset('SWG', [1211, 1150, 1180, 1250, 1220, 1211, 1190, 1200, 1180, 1230, 1200, 1215], getMainColor()),
				createLineDataset('VPN', [32, 28, 35, 30, 25, 32, 29, 33, 27, 31, 34, 30], CHART_CONSTANTS.COLORS.DANGER),
				createLineDataset('DLP', [442, 420, 450, 480, 460, 442, 430, 440, 435, 445, 440, 442], CHART_CONSTANTS.COLORS.SECONDARY)
			];
			
			const ztnaChart = new Chart(ctx, {
				type: 'line',
				data: { labels: CHART_CONSTANTS.LABELS, datasets },
				options: {
					...CHART_CONSTANTS.DEFAULT_OPTIONS,
					layout: ChartOptions.layout(0),
					plugins: {
						legend: ChartOptions.legend(true, 'bottom', 11),
						tooltip: ChartOptions.tooltip('건', (context) => {
							if (context.dataset.label === '트래픽') {
								return context.dataset.label + ': ' + context.parsed.y + 'K';
							}
							return context.dataset.label + ': ' + context.parsed.y + '건';
						})
					},
					scales: {
						x: ChartOptions.scaleX(11, true),
						y: ChartOptions.scaleY(false)
					},
					elements: { line: { borderWidth: 1 } }
				}
			});
			
			saveChartInstance('ztnaBlockChart', ztnaChart);
		}
		
		// 사이트 접속 현황
		createMalwareBlockChart('malwareChart');
		createMalwareBlockChart('dashboardMalwareChart');
		
		// 정보유출 감시 현황
		createBarChart('dashboardDataLeakChart',
			[45, 38, 52, 41, 48, 45, 42, 39, 44, 47, 43, 46],
			[25, 22, 28, 24, 26, 25, 23, 21, 24, 27, 22, 26],
			'전체', '개인정보'
		);
		
		// 정보 유출 의심 현황 (혼합형 그래프)
		createMixedChart('casbBlockChart',
			[45, 38, 52, 41, 48, 45, 42, 39, 44, 47, 43, 46],
			[25, 22, 28, 24, 26, 25, 23, 21, 24, 27, 22, 26],
			[20, 16, 24, 17, 22, 20, 19, 18, 20, 23, 21, 20],
			'전체', '개인정보', '키워드'
		);
		
		// 서비스별 접속 현황 (AI 사용량 차트)
		createAITotalUsageChart();
		createAIUsageChart();
		
		// 시스템 트래픽 현황 (SWG, VPN, DLP)
		const trafficChartElement = document.getElementById('trafficChart');
		if (trafficChartElement) {
			const ctx = trafficChartElement.getContext('2d');
			const datasets = [
				createLineDataset('SWG', [1200, 1300, 1250, 1400, 1350, 1280, 1320, 1380, 1300, 1420, 1350, 1400], getMainColor()),
				createLineDataset('VPN', [800, 850, 900, 950, 920, 880, 900, 950, 920, 980, 950, 1000], CHART_CONSTANTS.COLORS.SECONDARY),
				createLineDataset('DLP', [600, 650, 700, 750, 720, 680, 700, 750, 720, 780, 750, 800], CHART_CONSTANTS.COLORS.TERTIARY)
			];
			
			const trafficChart = new Chart(ctx, {
				type: 'line',
				data: { labels: CHART_CONSTANTS.LABELS, datasets },
				options: {
					...CHART_CONSTANTS.DEFAULT_OPTIONS,
					layout: ChartOptions.layout(40),
					plugins: {
						legend: ChartOptions.legend(true, 'bottom', 11),
						tooltip: ChartOptions.tooltip('K')
					},
					scales: {
						x: ChartOptions.scaleX(11, true),
						y: ChartOptions.scaleY(false)
					},
					elements: { line: { borderWidth: 1 } }
				}
			});
			
			saveChartInstance('trafficChart', trafficChart);
		}
		
		console.log('All charts initialized successfully');
	} catch (error) {
		console.error('Error during chart initialization:', error);
	}
}

// 전역 함수로 노출
window.initCharts = initCharts;
window.destroyCharts = destroyCharts;

// ============================================
// DOM 로드 후 초기화
// ============================================

document.addEventListener('DOMContentLoaded', function() {
	console.log('DOM loaded, initializing charts...');
	
	// 실시간 시간 업데이트
	function updateTime() {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const timeElement = document.getElementById('currentTime');
		if (timeElement) {
			timeElement.textContent = hours + ':' + minutes;
		}
	}
	
	updateTime();
	setInterval(updateTime, 60000);
	
	// 3초마다 시스템 리소스 업데이트
	setInterval(updateSystemResources, 3000);
	
	// 차트 초기화
	initCharts();
	
	// 워드 클라우드 초기화
	setTimeout(() => {
		try {
			initWordCloud();
		} catch (error) {
			console.error('워드 클라우드 초기화 실패:', error);
		}
	}, 1000);
	
	// 창 크기 변경 시 워드 클라우드 재생성
	let resizeTimeout;
	window.addEventListener('resize', function() {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			try {
				createWordCloud();
			} catch (error) {
				console.error('워드 클라우드 재생성 실패:', error);
			}
		}, 500);
	});
});

// ============================================
// 전역 함수로 노출
// ============================================

window.createTrafficChart = createTrafficChart;
window.createMalwareBlockChart = createMalwareBlockChart;
window.createSwgStackedBarChart = createSwgStackedBarChart;
window.createSystemAccessChart = createSystemAccessChart;
window.createExternalAccessChart = createExternalAccessChart;
window.createMixedChart = createMixedChart;
window.createAITotalUsageChart = createAITotalUsageChart;
window.createAIUsageChart = createAIUsageChart;
window.createLineChart = function(elementId, data, label, color = '#36a2eb') {
	const ctx = document.getElementById(elementId);
	if (!ctx) {
		console.error(`Element with id '${elementId}' not found`);
		return null;
	}
	
	let borderColor = color;
	let backgroundColor = color;
	
	if (color.startsWith('#')) {
		const hex = color.replace('#', '');
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		borderColor = `rgba(${r}, ${g}, ${b}, 1)`;
		backgroundColor = `rgba(${r}, ${g}, ${b}, 0.1)`;
	}
	
	return new Chart(ctx, {
		type: 'line',
		data: {
			labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
			datasets: [{
				label,
				data,
				borderColor,
				backgroundColor,
				borderWidth: 2,
				fill: true,
				tension: 0.4,
				pointBackgroundColor: borderColor,
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
				pointRadius: 4,
				pointHoverRadius: 6
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: { legend: { display: false } },
			scales: {
				y: {
					beginAtZero: true,
					max: 100,
					grid: { color: 'rgba(160, 160, 160, 0.3)', lineWidth: 1 },
					ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 } }
				},
				x: {
					grid: { color: 'rgba(160, 160, 160, 0.3)', lineWidth: 1 },
					ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 } }
				}
			},
			animation: { duration: 2000, easing: 'easeOutQuart' }
		}
	});
};
window.createHarmfulBlockSystemChart = createHarmfulBlockSystemChart;
window.initWordCloud = initWordCloud;
