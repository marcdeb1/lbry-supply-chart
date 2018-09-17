function getReward(blockHeight) {
 if (blockHeight == 0) {
   return 400000000;
 }
 else if (blockHeight <= 5100) {
   return 1;
 }
 else if (blockHeight <= 55000) {
   return 1 + Math.floor((blockHeight - 5001) / 100);
 }
 else {
   return Math.max(0, 500 - Math.floor(((Math.sqrt((blockHeight - 55001) / 4 + 1)) - 1) / 2));
 }
}

function loadChartData() {
	var api_url = "https://chainquery.lbry.io/api/sql?query=";
	var query = "SELECT id, created_at FROM block";
	var url = api_url + query;
  var loadProgress = $('.block-size-chart-container .load-progress');
  $.ajax({
    url: url,
    type: 'get',
    dataType: 'json',
    beforeSend: function() {
      chartLoadInProgress = true;
      loadProgress.css({ display: 'block' });
    },
		success: function(response) {
		if(response.success) {
      chartData = [];
  		var blocks = response.data;
    	var supply = 0;
			for(var i = 0; i < blocks.length; i++) {
      	if(i % 100 == 0) {
      	var b = blocks[i];
      	var reward = getReward(parseInt(b.id) - 1);
    		supply += reward;
        chartData.push({
        	date: Date.parse(b.created_at),
          CirculatingSupply: supply,
          RewardLBC: reward
        });
        }
			}
      if(chart) {
      	chart.dataProvider = chartData;
        chart.validateNow();
        chart.validateData();
      }
  	}
  	else {
  		console.log("Could not fetch block data.");
  	}
	},
    complete: function() {
      chartLoadInProgress = false;
      loadProgress.css({ display: 'none' });
    }
});
}

var chart;
var chartData = [];
var chartLoadInProgress = false;
AmCharts.ready(function() {
chart = AmCharts.makeChart('mining-inflation-chart', {
type: 'serial',
theme: 'light',
mouseWheelZoomEnabled: true,
height: '100%',
categoryField: 'date',
synchronizeGrid: true,
dataProvider: chartData,
valueAxes: [
{
	id: 'v-supply',
	axisColor: '#1e88e5',
	axisThickness: 2,
  labelFunction: function(value) {
     return (Math.round((value / 1000000) * 1000000)/1000000).toFixed(2) + 'M';
                    }
},
{
	id: 'v-reward',
	axisColor: '#00e676',
	axisThickness: 2
}
],
categoryAxis: {
parseDates: true,
autoGridCount: false,
minorGridEnabled: true,
minorGridAlpha: 0.04,
axisColor: '#dadada',
twoLineMode: true
},
graphs: [
{
	id: 'g-supply',
	valueAxis: 'v-supply', // we have to indicate which value axis should be used
	title: 'Circulating supply (millions LBC)',
	valueField: 'CirculatingSupply',
	bullet: 'round',
	bulletBorderThickness: 1,
	bulletBorderAlpha: 1,
	bulletColor: '#ffffff',
	bulletSize: 5,
	useLineColorForBulletBorder: true,
	lineColor: '#1e88e5',
	hideBulletsCount: 101,
	balloonText: '[[CirculatingSupply]]',
	switchable: false,
  balloonFunction: function(item, graph) {
       var result = graph.balloonText;
       return result.replace('[[CirculatingSupply]]', (Math.round((item.dataContext.CirculatingSupply / 1000000) * 1000000)/1000000).toFixed(2));
                    }
},
{
	id: 'g-reward',
	valueAxis: 'v-reward',
	title: 'Reward (LBC)',
	valueField: 'RewardLBC',
	bullet: 'round',
	bulletBorderThickness: 1,
	bulletBorderAlpha: 1,
	bulletColor: '#ffffff',
	bulletSize: 5,
	useLineColorForBulletBorder: true,
	lineColor: '#00e676',
	balloonText: '[[RewardLBC]] LBC',
	hideBulletsCount: 101
}
],
chartCursor: {
cursorAlpha: 0.1,
fullWidth: true,
valueLineBalloonEnabled: true,
categoryBalloonColor: '#333333',
cursorColor: '#1e88e5'
},
chartScrollbar: {
scrollbarHeight: 36,
color: '#888888',
gridColor: '#bbbbbb'
},
legend: {
marginLeft: 110,
useGraphSettings: true,
valueAlign: 'right',
valueWidth: 60,
spacing: 64,
},
export: {
enabled: true,
fileName: 'lbry-mining-inflation-chart',
position: 'bottom-right',
divId: 'chart-export'
}
});
loadChartData();
});