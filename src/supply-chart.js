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
	var level = (blockHeight - 55001) / 32;
	var reduction = Math.floor((Math.floor(Math.sqrt((8 * level) + 1)) - 1) / 2);
	while(!(withinLevelBounds(reduction, level))) {
        if(((reduction * reduction + reduction) / 2) > level) {
            reduction--;
        }
        else {
            reduction++;
        }
	}
	return Math.max(0, 500 - reduction);
 }
}

function withinLevelBounds(reduction, level) {
    if(((reduction * reduction + reduction) / 2) > level) {
        return false;
	}
    reduction += 1;
    if(((reduction * reduction + reduction) / 2) <= level) {
        return false;
	}
    return true;
}

function getAverageBlockTime(blocks) {
	var numBlocks = blocks.length;
	var windowSize = 100;
	var sum = 0;
	for(i = numBlocks - windowSize; i < numBlocks; i++) {
		sum += blocks[i].block_time - blocks[i-1].block_time;
	}
	return sum / windowSize;
}

function buildChartData(blockData) {
	var chartData = [];
    var supply = 0;
	// Historical Data
	for(var i = 0; i < blockData.length; i++) {
		var b = blockData[i];
		var reward = getReward(b.id - 1);
		supply += reward;
		if(b.id == 1) { // Reward for 1st block set to 0 for scale
			reward = 0;
		}
      	if(i % 10 == 0) {
			chartData.push({
				date: new Date(b.block_time * 1000),
				CirculatingSupply: supply,
				RewardLBC: reward,
				BlockId: b.id
			});
        }
	}
	// Future blocks
	var averageBlockTime = getAverageBlockTime(blockData);
	var reward = 500;
	var skip = 1000;
	var blockId = (Math.floor((blockData[blockData.length - 1].id + 1) / skip) * skip);
	var lastBlockTime = blockData[blockData.length - 1].block_time;
	while(reward > 0) {
		reward = getReward(blockId - 1);
		supply += reward;
		lastBlockTime += averageBlockTime;
		if(blockId % skip == 0) {
			chartData.push({
				date: new Date(lastBlockTime * 1000),
				CirculatingSupply: supply,
				RewardLBC: reward,
				BlockId: blockId
			});
		}
		blockId += 1;
	}
	return chartData;
}

function loadChartData() {
	var api_url = "https://chainquery.lbry.io/api/sql?query=";
	var query = "SELECT id, block_time FROM block";
	var url = api_url + query;
  var loadProgress = $('.mining-inflation-chart-container .load-progress');
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
		chartData = buildChartData(response.data);
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
titles: [
{
       text: "LBRY Supply Chart",
       size: 15,
}
],
responsive: {
       enabled: true,
},
valueAxes: [
{
	id: 'v-supply',
	axisColor: '#1e88e5',
	axisThickness: 2,
	position: 'left',
  labelFunction: function(value) {
     return (Math.round((value / 1000000) * 1000000)/1000000).toFixed(2);
                    }
},
{
	id: 'v-reward',
	axisColor: '#00e676',
	axisThickness: 2,
	position: 'right',
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
	title: 'Available supply (millions LBC)',
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
	title: 'Block Reward (LBC)',
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
valueText: "",
spacing: 64,

},
export: {
enabled: true,
fileName: 'lbry-supply-chart',
position: 'bottom-right',
divId: 'chart-export'
}
});
loadChartData();
});