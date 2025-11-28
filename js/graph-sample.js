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
		INFO: '--chart-info',
		EXTRA: '--chart-extra'
	};
	
	const fallbackMap = {
		
		PRIMARY: 'rgba(54, 162, 235, 1)',
		SECONDARY: 'rgba(75, 192, 192, 1)',
		TERTIARY: 'rgba(153, 102, 255, 1)',
		DANGER: 'rgba(255, 99, 132, 1)',
		WARNING: 'rgba(255, 159, 64, 1)',
		SUCCESS: 'rgba(75, 192, 192, 1)',
		INFO: 'rgba(54, 162, 235, 1)',
		EXTRA: 'rgba(201, 203, 207, 1)'
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
		INFO: getChartColor('INFO'),
		EXTRA: getChartColor('EXTRA')
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
			padding: position === 'bottom' ? 12 : 8,
			generateLabels: function(chart) {
				// 기본 범례 레이블 생성
				const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
				// 숨겨진 데이터셋의 범례에 취소선 추가
				return original.map(function(label) {
					const meta = chart.getDatasetMeta(label.datasetIndex);
					// Chart.js는 meta.hidden을 사용하여 데이터셋의 표시/숨김 상태를 관리
					if (meta && meta.hidden === true) {
						label.textDecoration = 'line-through';
						label.fontColor = label.fontColor || '#888888';
					} else {
						label.textDecoration = 'none';
					}
					return label;
				});
			}
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
	// color가 명시적으로 전달된 경우 (undefined가 아닌 경우) 사용, 그렇지 않으면 mainColor 사용
	const defaultColor = (color && color.trim() !== '') ? color : mainColor;
	// const defaultColor = (color !== undefined && color !== null && color !== '') ? color : mainColor;
	
	// 투명도 적용 헬퍼 함수
	const applyOpacity = (colorStr, opacity) => {
		if (!colorStr) return colorStr;
		// rgba 형식인 경우 - 투명도만 교체
		if (colorStr.includes('rgba')) {
			return colorStr.replace(/rgba\(([^)]+)\)/, (match, content) => {
				const parts = content.split(',').map(s => s.trim());
				if (parts.length === 4) {
					// 이미 rgba 형식이면 투명도만 교체
					return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`;
				}
				return match;
			});
		}
		// hex 형식인 경우
		if (colorStr.startsWith('#')) {
			const hex = colorStr.slice(1);
			// 3자리 hex (#RGB) 또는 6자리 hex (#RRGGBB) 처리
			let r, g, b;
			if (hex.length === 3) {
				r = parseInt(hex[0] + hex[0], 16);
				g = parseInt(hex[1] + hex[1], 16);
				b = parseInt(hex[2] + hex[2], 16);
			} else {
				r = parseInt(hex.slice(0, 2), 16);
				g = parseInt(hex.slice(2, 4), 16);
				b = parseInt(hex.slice(4, 6), 16);
			}
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		// rgb 형식인 경우
		if (colorStr.includes('rgb(')) {
			return colorStr.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
		}
		return colorStr;
	};
	
	// borderColor 투명도 설정 (기본값 0.8, options로 오버라이드 가능)
	const borderOpacity = options.borderOpacity !== undefined ? options.borderOpacity : 1;
	// backgroundColor 투명도 설정 (기본값 0.2, options로 오버라이드 가능)
	const backgroundColorOpacity = options.backgroundColorOpacity !== undefined ? options.backgroundColorOpacity : 0.15;
	
	// options에서 색상 관련 속성 제외 (명시적으로 전달된 color를 우선 사용)
	const { color: _, borderColor: __, backgroundColor: ___, pointBackgroundColor: ____, pointBorderColor: _____, colorType: ______, ...restOptions } = options;
	
	// 원래 색상 정보 저장 (테마 업데이트 시 사용)
	// options에서 colorType이 명시적으로 전달된 경우 사용, 없으면 색상 값을 비교하여 추론
	let originalColorType = options.colorType || null;
	
	// colorType이 명시되지 않은 경우 색상 값을 비교하여 추론
	if (!originalColorType && color !== undefined && color !== null && color !== '') {
		// 색상 값을 가져와서 비교
		const primaryColor = getChartColor('PRIMARY');
		const secondaryColor = getChartColor('SECONDARY');
		const tertiaryColor = getChartColor('TERTIARY');
		const dangerColor = getChartColor('DANGER');
		const warningColor = getChartColor('WARNING');
		const successColor = getChartColor('SUCCESS');
		const infoColor = getChartColor('INFO');
		
		// 색상 값 비교 (rgba 형식의 경우 투명도 제거하고 비교)
		const normalizeColor = (colorStr) => {
			if (!colorStr) return '';
			// rgba에서 투명도 제거하여 비교
			return colorStr.replace(/rgba?\(([^)]+)\)/, (match, content) => {
				const parts = content.split(',').map(s => s.trim());
				if (parts.length >= 3) {
					return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
				}
				return match;
			});
		};
		
		const normalizedColor = normalizeColor(color);
		
		if (normalizedColor && (normalizeColor(primaryColor) === normalizedColor || normalizeColor(mainColor) === normalizedColor)) {
			originalColorType = 'PRIMARY';
		} else if (normalizedColor && normalizeColor(secondaryColor) === normalizedColor) {
			originalColorType = 'SECONDARY';
		} else if (normalizedColor && normalizeColor(tertiaryColor) === normalizedColor) {
			originalColorType = 'TERTIARY';
		} else if (normalizedColor && normalizeColor(dangerColor) === normalizedColor) {
			originalColorType = 'DANGER';
		} else if (normalizedColor && normalizeColor(warningColor) === normalizedColor) {
			originalColorType = 'WARNING';
		} else if (normalizedColor && normalizeColor(successColor) === normalizedColor) {
			originalColorType = 'SUCCESS';
		} else if (normalizedColor && normalizeColor(infoColor) === normalizedColor) {
			originalColorType = 'INFO';
		} else {
			// 명시적으로 색상이 지정된 경우 원래 색상 값 저장
			originalColorType = color;
		}
	}
	
	return {
		label,
		data,
		borderColor: applyOpacity(defaultColor, borderOpacity),
		backgroundColor: applyOpacity(defaultColor, backgroundColorOpacity),
		borderWidth: options.borderWidth !== undefined ? options.borderWidth : 1,
		tension: 0.4,
		fill: options.fill !== false,
		pointBackgroundColor: applyOpacity(defaultColor, borderOpacity),
		pointBorderColor: applyOpacity(defaultColor, borderOpacity),
		pointBorderWidth: options.pointBorderWidth || 0,
		pointRadius: options.pointRadius || 2,
		pointHoverRadius: options.pointHoverRadius || 2,
		_originalColorType: originalColorType, // 원래 색상 타입 저장 (테마 업데이트 시 사용)
		...restOptions
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
	
	// datasets에 color 속성이 있으면 createLineDataset을 사용하여 변환
	const processedDatasets = datasets.map(dataset => {
		if (dataset.color && !dataset.borderColor) {
			// color 속성이 있고 borderColor가 없으면 createLineDataset 사용
			const backgroundColorOpacity = options.backgroundColorOpacity !== undefined ? options.backgroundColorOpacity : 0.3;
			return createLineDataset(dataset.label, dataset.data, dataset.color, {
				...dataset,
				backgroundColorOpacity: backgroundColorOpacity
			});
		}
		return dataset;
	});
	
	const ctx = chartElement.getContext('2d');
	const chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: options.labels || CHART_CONSTANTS.LABELS,
			datasets: processedDatasets
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
		createLineDataset('차단수', [28, 25, 32, 26, 30, 28, 27, 24, 29, 31, 26, 29], CHART_CONSTANTS.COLORS.WARNING),
		createLineDataset('트래픽', [452, 420, 480, 500, 480, 452, 440, 460, 450, 470, 460, 465], CHART_CONSTANTS.COLORS.SECONDARY,)
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
		createLineDataset('접속자 수', [1211, 1150, 1180, 1250, 1220, 1211, 1190, 1200, 1180, 1230, 1200, 1215], CHART_CONSTANTS.COLORS.PRIMARY, { colorType: 'PRIMARY' }),
		createLineDataset('접속 차단 수', [32, 28, 35, 30, 25, 32, 29, 33, 27, 31, 34, 30], CHART_CONSTANTS.COLORS.DANGER, { colorType: 'DANGER' }),
		createLineDataset('차단수', [20, 18, 22, 19, 16, 20, 18, 21, 17, 20, 22, 19], CHART_CONSTANTS.COLORS.WARNING, { colorType: 'WARNING' }),
		createLineDataset('트래픽', [442, 420, 450, 480, 460, 442, 430, 440, 435, 445, 440, 442], CHART_CONSTANTS.COLORS.TERTIARY, { colorType: 'TERTIARY' })
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

// 사이트 접속 현황 막대 그래프
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
				borderWidth: options.borderWidth || 1,
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

// 서비스별 접속현황 원형 그래프
function createAITotalUsageChart() {
	const canvas = document.getElementById('aiTotalUsageChart');
	if (!canvas) {
		console.error('aiTotalUsageChart canvas element not found');
		return null;
	}
	
	const totalUsageData = [
		{ name: '메일', value: 20, color: getChartColor('PRIMARY') },
		{ name: '메신저', value: 5, color: getChartColor('SECONDARY') },
		{ name: 'SNS', value: 12, color: getChartColor('TERTIARY') },
		{ name: '댓글', value: 3, color: getChartColor('WARNING') },
		{ name: '업무공유', value: 8, color: getChartColor('DANGER') },
		{ name: '웹하드', value: 10, color: getChartColor('SUCCESS') },
		{ name: 'FTP', value: 32, color: getChartColor('INFO') },
		{ name: '생성형 AI', value: 10, color: getChartColor('EXTRA') }
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
		// createMalwareBlockChart 함수가 정의되지 않아 주석 처리
		
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
		// createAIUsageChart 함수가 정의되지 않아 주석 처리
		
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
	
	// 차트 초기화
	initCharts();
	
	// 워드 클라우드 초기화
	// initWordCloud, createWordCloud 함수가 정의되지 않아 주석 처리
	// setTimeout(() => {
	// 	try {
	// 		initWordCloud();
	// 	} catch (error) {
	// 		console.error('워드 클라우드 초기화 실패:', error);
	// 	}
	// }, 1000);
	
	// 창 크기 변경 시 워드 클라우드 재생성
	// let resizeTimeout;
	// window.addEventListener('resize', function() {
	// 	clearTimeout(resizeTimeout);
	// 	resizeTimeout = setTimeout(() => {
	// 		try {
	// 			createWordCloud();
	// 		} catch (error) {
	// 			console.error('워드 클라우드 재생성 실패:', error);
	// 		}
	// 	}, 500);
	// });
});

// ============================================
// 전역 함수로 노출
// ============================================

window.createTrafficChart = createTrafficChart;
// window.createMalwareBlockChart = createMalwareBlockChart; // 함수 정의 없음
window.createSwgStackedBarChart = createSwgStackedBarChart;
window.createSystemAccessChart = createSystemAccessChart;
window.createExternalAccessChart = createExternalAccessChart;
window.createMixedChart = createMixedChart;
window.createAITotalUsageChart = createAITotalUsageChart;
// window.createAIUsageChart = createAIUsageChart; // 함수 정의 없음
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
				borderWidth: 1,
				fill: true,
				tension: 0.4,
				pointBackgroundColor: borderColor,
				pointBorderColor: '#fff',
				pointBorderWidth: 4,
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
// window.createHarmfulBlockSystemChart = createHarmfulBlockSystemChart; // 함수 정의 없음
// window.initWordCloud = initWordCloud; // 함수 정의 없음
