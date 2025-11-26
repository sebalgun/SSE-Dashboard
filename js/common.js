// JavaScript Document

//===========================================
//Toggle
//===========================================
$(function(){
	$('#setcolorbtn').click(function(){
		$("#dateRangeMenu").hide();
		$("#setcolor").toggle();
	});
	$('#dateRangeBtn').click(function(){
		$("#setcolor").hide();
		$("#dateRangeMenu").toggle();
	});
});
//===========================================
//Color Theme
//===========================================
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // 로컬 스토리지에서 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('selectedTheme');
    
    // 저장된 테마가 없으면 디폴트 설정 적용
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('bgcolor04'); // 디폴트 설정
    }

    // 각 버튼에 이벤트 리스너 추가
    for (let i = 1; i <= 9; i++) {
        const button = document.getElementById(`bgcolor0${i}`);
        button.addEventListener('click', () => {
            const themeClass = `bgcolor0${i}`;
            applyTheme(themeClass);
            localStorage.setItem('selectedTheme', themeClass);
        });
    }

    // 테마 적용 함수
    function applyTheme(themeClass) {
        const isLightTheme = ['bgcolor01', 'bgcolor02','bgcolor03'].includes(themeClass);
        const themeMode = isLightTheme ? 'light' : 'dark';

        body.className = themeClass;
        body.setAttribute('data-bs-theme', themeMode);
        
        // 브라우저가 CSS를 다시 계산한 후 차트 업데이트 (requestAnimationFrame 사용)
        requestAnimationFrame(() => {
            // 추가로 한 프레임 더 대기하여 CSS 변수가 완전히 적용되도록 보장
            requestAnimationFrame(() => {
                // 차트 재생성 (테마 변경 시 색상이 제대로 적용되도록)
                if (typeof window.initCharts === 'function') {
                    window.initCharts();
                } else {
                    // initCharts가 없으면 기존 방식으로 업데이트
                    updateChartsForTheme(themeClass);
                }
            });
        });
    }
    
    // CSS 변수에서 텍스트 색상 가져오기
    function getChartTextColor() {
        const chartTextColor = getComputedStyle(document.body).getPropertyValue('--chart-text-color').trim();
        if (chartTextColor) return chartTextColor;
        
        // fallback: --c-text 사용
        const textColor = getComputedStyle(document.body).getPropertyValue('--c-text').trim();
        if (textColor) return textColor;
        
        // 최종 fallback
        return '#ffffff';
    }
    
    // CSS 변수에서 메인 색상 가져오기 (전역 노출)
    window.getMainColor = function() {
        const mainColor = getComputedStyle(document.body).getPropertyValue('--c-main').trim();
        if (mainColor) return mainColor;
        
        // fallback
        return 'rgba(54, 162, 235, 1)';
    };
    
    // 테마에 맞는 차트 업데이트 함수 (통합)
    function updateChartsForTheme(themeClass) {
        if (typeof Chart === 'undefined') return;
        
        // CSS 변수에서 텍스트 색상 가져오기 (매번 새로 읽어옴)
        const textColor = getChartTextColor();
        
        // 라이트 테마(bgcolor01, bgcolor02, bgcolor03)인 경우 비비드한 컬러 팔레트 사용
        const isLightTheme = ['bgcolor01', 'bgcolor02', 'bgcolor03'].includes(themeClass);
        // bgcolor01, bgcolor02만 체크 (막대그래프 투명도 1 적용용)
        const isLightThemeForBarOpacity = ['bgcolor01', 'bgcolor02'].includes(themeClass);
        const vibrantColors = [
            '#0066FF',      // 비비드한 파란색
            '#00CC66',      // 비비드한 초록색
            '#9933FF',      // 비비드한 보라색
            '#FF3366',      // 비비드한 빨간색
            '#FF6600',      // 비비드한 주황색
            '#00CCFF',      // 비비드한 청록색
            '#FFCC00',      // 비비드한 노란색
            '#FF0066'       // 비비드한 핑크색
        ];
        
        // 모든 차트 인스턴스 찾기
        const canvasElements = document.querySelectorAll('canvas');
        
        canvasElements.forEach(canvas => {
            const chart = Chart.getChart(canvas);
            if (chart) {
                // 차트 타입 확인
                const chartType = chart.config?.type || chart.type || '';
                const isBarChart = chartType === 'bar';
                const isLineChart = chartType === 'line';
                
                // 차트 옵션 업데이트
                if (chart.options && chart.options.plugins) {
                    // 범례 색상 변경 (즉시 반영되도록 강제 설정)
                    if (chart.options.plugins.legend) {
                        if (!chart.options.plugins.legend.labels) {
                            chart.options.plugins.legend.labels = {};
                        }
                        chart.options.plugins.legend.labels.color = textColor;
                        // 범례가 함수로 설정된 경우를 대비하여 직접 설정
                        if (typeof chart.options.plugins.legend.labels.color === 'function') {
                            chart.options.plugins.legend.labels.color = textColor;
                        }
                    }
                    
                    // 툴팁 색상 변경 (항상 #FFF로 고정)
                    if (chart.options.plugins.tooltip) {
                        chart.options.plugins.tooltip.titleColor = '#FFF';
                        chart.options.plugins.tooltip.bodyColor = '#FFF';
                        if (isLightTheme) {
                            chart.options.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                            chart.options.plugins.tooltip.borderColor = 'rgba(0, 0, 0, 0.2)';
                        } else {
                            chart.options.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                            chart.options.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }
                    }
                }
                
                // 스케일 텍스트 색상 변경
                if (chart.options && chart.options.scales) {
                    Object.keys(chart.options.scales).forEach(scaleKey => {
                        const scale = chart.options.scales[scaleKey];
                        if (scale && scale.ticks) {
                            scale.ticks.color = textColor;
                            // font 객체가 있는 경우도 업데이트
                            if (scale.ticks.font) {
                                scale.ticks.font.color = textColor;
                            }
                        }
                        if (scale && scale.grid) {
                            scale.grid.color = 'rgba(160, 160, 160, 0.3)';
                        }
                    });
                }
                
                // 데이터셋 색상 업데이트 (라이트 테마는 비비드한 색상, 다크 테마는 CSS 변수 사용)
                if (chart.data && chart.data.datasets) {
                    // 다크 테마용 CSS 변수 색상 배열 (매번 새로 읽어옴)
                    const darkThemeColors = [
                        window.getChartColor ? window.getChartColor('PRIMARY') : (window.getMainColor ? window.getMainColor() : 'rgba(54, 162, 235, 1)'),
                        window.getChartColor ? window.getChartColor('SECONDARY') : 'rgba(75, 192, 192, 1)',
                        window.getChartColor ? window.getChartColor('TERTIARY') : 'rgba(153, 102, 255, 1)',
                        window.getChartColor ? window.getChartColor('DANGER') : 'rgba(255, 99, 132, 1)',
                        window.getChartColor ? window.getChartColor('WARNING') : 'rgba(255, 159, 64, 1)',
                        window.getChartColor ? window.getChartColor('SUCCESS') : 'rgba(75, 192, 192, 1)',
                        window.getChartColor ? window.getChartColor('INFO') : 'rgba(54, 162, 235, 1)'
                    ];
                    
                    chart.data.datasets.forEach((dataset, index) => {
                        let selectedColor;
                        let r, g, b;
                        
                        if (isLightTheme) {
                            // 라이트 테마: 비비드한 색상 사용
                            selectedColor = vibrantColors[index % vibrantColors.length];
                            const hex = selectedColor.replace('#', '');
                            r = parseInt(hex.substr(0, 2), 16);
                            g = parseInt(hex.substr(2, 2), 16);
                            b = parseInt(hex.substr(4, 2), 16);
                            dataset.borderWidth = Math.max(dataset.borderWidth || 1, 3);
                            if (dataset.pointRadius !== undefined) {
                                dataset.pointRadius = Math.max(dataset.pointRadius || 2, 4);
                            }
                        } else {
                            // 다크 테마: CSS 변수에서 색상 가져오기
                            selectedColor = darkThemeColors[index % darkThemeColors.length];
                            
                            // 색상을 rgba로 변환
                            if (selectedColor.startsWith('#')) {
                                const hex = selectedColor.replace('#', '');
                                r = parseInt(hex.substr(0, 2), 16);
                                g = parseInt(hex.substr(2, 2), 16);
                                b = parseInt(hex.substr(4, 2), 16);
                            } else if (selectedColor.startsWith('rgba')) {
                                const match = selectedColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
                                if (match) {
                                    r = parseInt(match[1]);
                                    g = parseInt(match[2]);
                                    b = parseInt(match[3]);
                                } else {
                                    r = 54; g = 162; b = 235; // 기본값
                                }
                            } else {
                                r = 54; g = 162; b = 235; // 기본값
                            }
                        }
                        
                        // borderColor 설정
                        dataset.borderColor = selectedColor;
                        
                        // 각 데이터셋의 타입 확인 (혼합형 차트 대응)
                        const datasetType = dataset.type || chartType;
                        const isDatasetBar = datasetType === 'bar';
                        const isDatasetLine = datasetType === 'line';
                        
                        // bgcolor01, bgcolor02이고 막대그래프인 경우에만 투명도를 1.0으로 설정
                        const shouldSetOpacityTo1 = isLightThemeForBarOpacity && isDatasetBar;
                        // bgcolor01, bgcolor02이고 선그래프인 경우 내부 투명도를 0.4로 설정
                        const shouldSetLineOpacityTo04 = isLightThemeForBarOpacity && isDatasetLine;
                        // 선그래프에서 fill이 true인지 확인
                        const isLineChartWithFill = isDatasetLine && (dataset.fill === true || dataset.fill === 'origin' || dataset.fill === 'start' || dataset.fill === 'end');
                        
                        // backgroundColor가 배열인 경우 (doughnut 차트 등)
                        if (Array.isArray(dataset.backgroundColor)) {
                            dataset.backgroundColor = dataset.backgroundColor.map((bgColor, bgIndex) => {
                                let colorToUse;
                                if (isLightTheme) {
                                    const colorIndex = (index * dataset.backgroundColor.length + bgIndex) % vibrantColors.length;
                                    colorToUse = vibrantColors[colorIndex];
                                    const vibrantHex = colorToUse.replace('#', '');
                                    const vibrantR = parseInt(vibrantHex.substr(0, 2), 16);
                                    const vibrantG = parseInt(vibrantHex.substr(2, 2), 16);
                                    const vibrantB = parseInt(vibrantHex.substr(4, 2), 16);
                                    const opacity = shouldSetOpacityTo1 ? 1.0 : 1.0;
                                    return `rgba(${vibrantR}, ${vibrantG}, ${vibrantB}, ${opacity})`;
                                } else {
                                    const colorIndex = (index * dataset.backgroundColor.length + bgIndex) % darkThemeColors.length;
                                    colorToUse = darkThemeColors[colorIndex];
                                    // 기존 투명도 추출 또는 기본값 사용
                                    let opacity = 0.8;
                                    if (typeof bgColor === 'string' && bgColor.startsWith('rgba')) {
                                        const match = bgColor.match(/rgba\([^)]+,\s*([\d.]+)\)/);
                                        if (match) {
                                            opacity = parseFloat(match[1]);
                                        }
                                    }
                                    // 색상을 rgba로 변환
                                    if (colorToUse.startsWith('#')) {
                                        const hex = colorToUse.replace('#', '');
                                        const colorR = parseInt(hex.substr(0, 2), 16);
                                        const colorG = parseInt(hex.substr(2, 2), 16);
                                        const colorB = parseInt(hex.substr(4, 2), 16);
                                        return `rgba(${colorR}, ${colorG}, ${colorB}, ${opacity})`;
                                    } else if (colorToUse.startsWith('rgba')) {
                                        // 이미 rgba인 경우 투명도만 변경
                                        return colorToUse.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${opacity})`);
                                    }
                                    return colorToUse;
                                }
                            });
                        } else {
                            // 단일 색상인 경우 (line, bar 차트 등)
                            let opacity;
                            if (shouldSetOpacityTo1) {
                                opacity = 1.0;
                            } else if (shouldSetLineOpacityTo04 && isLineChartWithFill) {
                                opacity = 0.4;
                            } else if (isLightTheme) {
                                opacity = 1.0;
                            } else {
                                // 다크 테마: 기존 투명도 유지
                                const existingBg = dataset.backgroundColor;
                                if (typeof existingBg === 'string' && existingBg.startsWith('rgba')) {
                                    const match = existingBg.match(/rgba\([^)]+,\s*([\d.]+)\)/);
                                    if (match) {
                                        opacity = parseFloat(match[1]);
                                    } else {
                                        opacity = 0.8;
                                    }
                                } else {
                                    opacity = 0.8;
                                }
                            }
                            dataset.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                        }
                        
                        // point 색상 설정
                        if (dataset.pointBackgroundColor !== undefined) {
                            if (Array.isArray(dataset.pointBackgroundColor)) {
                                dataset.pointBackgroundColor = dataset.pointBackgroundColor.map((_, bgIndex) => {
                                    if (isLightTheme) {
                                        const colorIndex = (index * dataset.pointBackgroundColor.length + bgIndex) % vibrantColors.length;
                                        return vibrantColors[colorIndex];
                                    } else {
                                        const colorIndex = (index * dataset.pointBackgroundColor.length + bgIndex) % darkThemeColors.length;
                                        return darkThemeColors[colorIndex];
                                    }
                                });
                            } else {
                                dataset.pointBackgroundColor = selectedColor;
                            }
                        }
                        if (dataset.pointBorderColor !== undefined) {
                            if (Array.isArray(dataset.pointBorderColor)) {
                                dataset.pointBorderColor = dataset.pointBorderColor.map((_, bgIndex) => {
                                    if (isLightTheme) {
                                        const colorIndex = (index * dataset.pointBorderColor.length + bgIndex) % vibrantColors.length;
                                        return vibrantColors[colorIndex];
                                    } else {
                                        const colorIndex = (index * dataset.pointBorderColor.length + bgIndex) % darkThemeColors.length;
                                        return darkThemeColors[colorIndex];
                                    }
                                });
                            } else {
                                dataset.pointBorderColor = selectedColor;
                            }
                        }
                    });
                }
                
                // 차트 업데이트 - 'none' 모드로 빠르게 업데이트하고 즉시 렌더링
                chart.update('none');
                
                // Chart.js v3+에서는 범례가 플러그인으로 렌더링되므로 명시적으로 다시 렌더링
                // 범례 옵션 변경 후 차트를 다시 렌더링하여 범례 색상이 즉시 반영되도록 함
                chart.render();
            }
        });
    }
    
    // 프로그래스 바 색상 업데이트 함수
    function updateProgressBarsForTheme() {
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
            
            const value = getComputedStyle(document.body).getPropertyValue(cssVar).trim();
            return value || fallback;
        }
        
        // 모든 프로그래스 바 찾기
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach(progressBar => {
            const currentWidth = parseFloat(progressBar.style.width) || 0;
            const isCpuPacket = progressBar.closest('.chart-bg:nth-child(1)') !== null;
            
            // 현재 값에 따라 색상 업데이트
            if (isCpuPacket && currentWidth > 90) {
                progressBar.style.backgroundColor = getProgressColor('danger');
            } else if (currentWidth > 80) {
                progressBar.style.backgroundColor = getProgressColor('warning');
            } else if (currentWidth > 60) {
                progressBar.style.backgroundColor = getProgressColor('caution');
            } else {
                progressBar.style.backgroundColor = getProgressColor('normal');
            }
        });
    }
    
    // 차트 생성 후 현재 테마에 맞게 자동 적용하는 함수 (전역 노출)
    window.applyChartTheme = function() {
        const currentTheme = body.className || localStorage.getItem('selectedTheme') || 'bgcolor04';
        // 약간의 지연을 두고 실행 (차트 생성 완료 대기)
        setTimeout(() => {
            updateChartsForTheme(currentTheme);
            updateProgressBarsForTheme();
        }, 100);
    };
});
//===========================================
//pw Button
//===========================================
$(document).ready(function(){
    $('.form-password i').on('click',function(){
        $('input').toggleClass('active');
        if($('input').hasClass('active')){
            $(this).attr('class',"fa-solid fa-eye on lg")
            .prev('input').attr('type',"text");
        }else{
            $(this).attr('class',"fa-regular fa-eye-slash lg")
            .prev('input').attr('type','password');
        }
    });
});

//===========================================
//eye Button
//===========================================
function eyeIcon(){	
	var $button = $('.eye');
	var $icon = $button.find('i');

	if( $icon.hasClass("fa-solid fa-eye on") ){
		$icon.removeClass().addClass("fa-regular fa-eye-slash");
	}
	else {
		$icon.removeClass().addClass("fa-solid fa-eye on");
	}
};
//===========================================
//lock Button
//===========================================
function lockIcon(){	
	var $button = $('.lock');
	var $icon = $button.find('i');

	if( $icon.hasClass("fa-solid fa-lock") ){
		$icon.removeClass().addClass("fa-solid fa-lock-open");
	}
	else {
		$icon.removeClass().addClass("fa-solid fa-lock on");
	}
};
//===========================================
//shield Button
//===========================================
function shieldIcon(){	
	var $button = $('.shield');
	var $icon = $button.find('i');

	if( $icon.hasClass("fa-solid fa-shield") ){
		$icon.removeClass().addClass("fa-solid fa-shield-halved");
	}
	else {
		$icon.removeClass().addClass("fa-solid fa-shield on");
	}
};
//===========================================
//heart Button
//===========================================
function heartIcon(){	
	var $button = $('.heart');
	var $icon = $button.find('i');

	if( $icon.hasClass("fa-solid fa-heart") ){
		$icon.removeClass().addClass("fa-regular fa-heart");
	}
	else {
		$icon.removeClass().addClass("fa-solid fa-heart on");
	}
};
//===========================================
//play Button
//===========================================
function playIcon(){	
	var $button = $('.play');
	var $icon = $button.find('i');

	if( $icon.hasClass("fa-solid fa-circle-play") ){
		$icon.removeClass().addClass("fa-solid fa-circle-stop");
	}
	else {
		$icon.removeClass().addClass("fa-solid fa-circle-play on");
	}
};
//===========================================
//face Button
//===========================================
function faceIcon(){	
	var $button = $('.face');
	var $icon = $button.find('i');

	if( $icon.hasClass("fa-solid fa-face-smile") ){
		$icon.removeClass().addClass("fa-solid fa-face-frown");
	}
	else {
		$icon.removeClass().addClass("fa-solid fa-face-smile on");
	}
};
					

//===========================================
//Dashboard graph button
//===========================================
function charttype(){
	$("#chartbtn-circle").on("click", function(){
		$("chart-body").removeClass().addClass("chart-circle");
	});
	$("#chartbtn-half").on("click", function(){
		$("chart-body").removeClass().addClass("chart-half");
	});
	$("#chartbtn-bar").on("click", function(){
		$("chart-body").removeClass().addClass("chart-bar");
	});
};


$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

//===========================================
//Time Display
//===========================================
$(document).ready(function(){
    // 현재 시간을 09로 설정하고 시간표시 업데이트
    function updateTimeDisplay() {
        const now = new Date();
        // 현재 시간을 09시로 설정 (분은 실제 분 사용)
        const currentHour = 9;
        const currentMinute = now.getMinutes();
        
        // 시간을 09:XX 형식으로 표시
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        // 모든 시간표시 요소 업데이트
        $('.btn-time .form-control').text(timeString);
    }
    
    // 페이지 로드 시 시간표시 업데이트
    updateTimeDisplay();
    
    // 1분마다 시간표시 업데이트
    setInterval(updateTimeDisplay, 60000);
    
    // Refresh 버튼 클릭 시 시간표시 업데이트
    $('.btn-time button').on('click', function() {
        updateTimeDisplay();
    });
});