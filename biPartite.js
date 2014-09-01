///<reference path="http://d3js.org/d3.v3.min.js"/>
-function () {
    var biPartiteChart = {};

    var me = this;
    this.options = {
        colors: ['#ef5464', '#f36d54', '#6798d0', '#ffcf56', '#5bc2a7', '#ea88b9', '#e7eaef'],
        header: {
            position: [108, -20],
            labelPosition: [-130, 40], //Column positions of labels.
            valuePosition: [-50, 100],
            barpercentColumn: [-10, 160],// x distance from left of main rect
        },
        transitionWidth: 250,
        width: 1100,
        height: 610,
        sortbyKey: false,
        margin: {
            b: 0,
            t: 40,
            l: 170,
            r: 50
        },
        rectangleWidth: 80,
        minHeight: 14,
        rectangleMargin: 0,
        transitionOpacity: 0.5,
        duration:500
    };

    /**
     *  sets Options
     * @param {object} options an object containing options
     */
    biPartiteChart.setOptions = function (options) {
        if (options === null || typeof options !== "object") {
            throw "options is not an object";
        }
        if (options.colors instanceof Array) {
            me.options.colors = options.colors;
        }

        if (options.header.labelPosition instanceof Array) {
            me.options.header.labelPosition = options.header.labelPosition;
        }
        if (options.header.valuePosition instanceof Array) {
            me.options.header.valuePosition = options.header.valuePosition;
        }
        if (options.header.barpercentColumn instanceof Array) {
            me.options.header.barpercentColumn = options.header.barpercentColumn;
        }
        if (options.header.position instanceof Array) {
            me.options.header.position = options.header.position;
        }

        if (typeof options.transitionWidth === "number") {
            me.options.transitionWidth = options.transitionWidth;
        }
        if (typeof options.width === "number") {
            me.options.width = options.width;
        }
        if (typeof options.height === "number") {
            me.options.height = options.height;
        }
        if (typeof options.sortbyKey === "boolean") {
            me.options.sortbyKey = options.sortbyKey;
        }
        if (typeof options.margin === "object") {
            me.options.margin = options.margin;
        }
        if (typeof options.rectangleWidth === "number") {
            me.options.rectangleWidth = options.rectangleWidth;
        }
        if (typeof options.minHeight === "number") {
            me.options.minHeight = options.minHeight;
        }
        if (typeof options.rectangleMargin === "number") {
            me.options.rectangleMargin = options.rectangleMargin;
        }
        if (typeof options.transitionOpacity === "number") {
            me.options.transitionOpacity = options.transitionOpacity;
        }
        if (typeof options.duration === "number") {
            me.options.duration = options.duration;
        }
    };

    /**
   *  partData
   * @public
   * From t he original data set, creates two opposing arrays containing the counts of each corresponding record on each side.
   */
    biPartiteChart.partData = function (data, p) {
        var sData = {};

        // gets unique columns names (first element in array) - In Bipartite Parlance this is the U-Set
        var columnNamesLeft = d3.set(data.map(function (d) { return d[0]; })).values();

        if (me.options.sortbyKey) {
            columnNamesLeft = columnNamesLeft.sort();
        }
        // gets unique destination column name (second element in array) - In Bipartite Parlance this is the V-Set
        var columnNamesRight = d3.set(data.map(function (d) { return d[1]; })).values();

        if (me.options.sortbyKey) {
            columnNamesRight = columnNamesRight.sort(d3.descending());
        }
        sData.keys = [columnNamesLeft, columnNamesRight];

        // creates an array of arrays with all values set to 0
        sData.data = [sData.keys[0].map(function () { return sData.keys[1].map(function () { return 0; }); }),
					  sData.keys[1].map(function () { return sData.keys[0].map(function () { return 0; }); })
        ];

        data.forEach(function (d) {
            sData.data[0][sData.keys[0].indexOf(d[0])][sData.keys[1].indexOf(d[1])] = d[p];
            sData.data[1][sData.keys[1].indexOf(d[1])][sData.keys[0].indexOf(d[0])] = d[p];
        });

        return sData;
    };

    function visualize(data) {
        var vis = {};

        function calculatePosition(a, s, e, b, m) {
            var total = d3.sum(a);
            var sum = 0,
                neededHeight = 0,
                leftoverHeight = e - s - 2 * b * a.length;
            var ret = [];

            a.forEach(
				function (d) {
				    var v = {};
				    v.percent = (total == 0 ? 0 : d / total);
				    v.value = d;
				    v.height = Math.max(v.percent * (e - s - 2 * b * a.length), m);
				    (v.height == m ? leftoverHeight -= m : neededHeight += v.height);
				    ret.push(v);
				}
			);
            var scaleFact = leftoverHeight / Math.max(neededHeight, 1);

            ret.forEach(
				function (d) {
				    d.percent = scaleFact * d.percent;
				    d.height = (d.height == m ? m : d.height * scaleFact);
				    d.middle = sum + b + d.height / 2;
				    d.y = s + d.middle - d.percent * (e - s - 2 * b * a.length) / 2;
				    d.h = d.percent * (e - s - 2 * b * a.length);
				    d.percent = (total == 0 ? 0 : d.value / total);
				    sum += 2 * b + d.height;
				}
			);
            return ret;
        }

        vis.mainBars = [calculatePosition(data.data[0].map(function (d) { return d3.sum(d); }), 0, me.options.height, me.options.rectangleMargin, me.options.minHeight),
						 calculatePosition(data.data[1].map(function (d) { return d3.sum(d); }), 0, me.options.height, me.options.rectangleMargin, me.options.minHeight)];

        vis.subBars = [[], []];
        vis.mainBars.forEach(function (pos, p) {
            pos.forEach(function (bar, i) {
                calculatePosition(data.data[p][i], bar.y, bar.y + bar.h, 0, 0).forEach(function (sBar, j) {
                    sBar.key1 = (p == 0 ? i : j);
                    sBar.key2 = (p == 0 ? j : i);
                    vis.subBars[p].push(sBar);
                });
            });
        });
        vis.subBars.forEach(function (sBar) {
            sBar.sort(function (a, b) { return (a.key1 < b.key1 ? -1 : a.key1 > b.key1 ? 1 : a.key2 < b.key2 ? -1 : a.key2 > b.key2 ? 1 : 0); });
        });

        vis.edges = vis.subBars[0].map(function (p, i) {
            return {
                key1: p.key1,
                key2: p.key2,
                y1: p.y,
                y2: vis.subBars[1][i].y,
                h1: p.h,
                h2: vis.subBars[1][i].h
            };
        });
        vis.keys = data.keys;
        return vis;
    }

    function arcTween(a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function (t) {
            return edgePolygon(i(t));
        };
    }

    function drawPart(data, id, p) {

        d3.select('#' + id).append('g')
                            .attr('class', 'part' + p)
                            .attr('transform', 'translate(' + (p * (me.options.transitionWidth + me.options.rectangleWidth)) + ',0)');
        var el = d3.select('#' + id + ' .part' + p);
        el.append('g')
             .attr('class', 'subbars');
        el.append('g')
            .attr('class', 'mainbars');
   
  

        var mainbar = d3.select('#' + id + ' .part' + p + ' .mainbars')
            .selectAll('.mainbar')
            .data(data.mainBars[p])
			.enter()
            .append('g')
                .attr('class', 'mainbar');

        mainbar.append('rect').attr('class', 'mainrect')
            // .attr('rx', 15)
            //.attr('ry', 15)
            .attr('x', 0).attr('y', function (d) { return d.middle - d.height / 2; })
            .attr('width', me.options.rectangleWidth).attr('height', function (d) { return d.height; });

        //draw bar label
        mainbar.append('text').attr('class', 'barlabel')
			                  .attr('x', me.options.header.labelPosition[p]).attr('y', function (d) { return d.middle + 5; })
			                  .text(function (d, i) { return data.keys[p][i]; })
			                  .attr('text-anchor', 'start');

        //draw count label
        mainbar.append('text').attr('class', 'barvalue')
			                  .attr('x', me.options.header.valuePosition[p]).attr('y', function (d) { return d.middle + 5; })
			                  .text(function (d) { return d.value; })
			                  .attr('text-anchor', 'end');

        //draw percentage label
        mainbar.append('text').attr('class', 'barpercent')
			                  .attr('x', me.options.header.barpercentColumn[p]).attr('y', function (d) { return d.middle + 5; })
			                  .text(function (d) { return '(' + Math.round(100 * d.percent) + '%)'; })
			                  .attr('text-anchor', 'end');

        //draws the rectangle
        d3.select('#' + id + ' .part' + p + ' .subbars')
			.selectAll('.subbar').data(data.subBars[p]).enter()
			.append('rect').attr('class', 'subbar')
			                .attr('x', 0)
                            .attr('y', function (d) { return d.y; })
                            .attr('width', me.options.rectangleWidth)
                            .attr('height', function (d) { return d.h; })
			                .style('fill', function (d) {
			                    var n = 1;
                           // console.log(d.key1);
			                    if (d === null || d.key1 == null || d.key1>5) alert('sadfsdf');
			                    return me.options.colors[d.key1];
			                });
    }

    // draws the interconnecting lines between the left and right rectangles
    function drawEdges(data, id) {
        d3.select('#' + id).append('g').attr('class', 'edges').attr('transform', 'translate(' + me.options.rectangleWidth + ',0)');

        d3.select('#' + id).select('.edges').selectAll('.edge').data(data.edges).enter().append('polygon').attr('class', 'edge')
			.attr('points', edgePolygon).style('fill', function (d) {
			    console.log(d.key1);
                 return me.options.colors[d.key1];
            }).style('opacity',me.options.transitionOpacity)
			.each(function (d) { this._current = d; });
    }

    // draws the headers on both sides with text
    function drawHeader(header, id) {
        d3.select('#' + id).append('g').attr('class', 'header').append('text').text(header[2])
			.attr('x', me.options.header.position[0]).attr('y', me.options.header.position[1]);

        [0, 1].forEach(function (d) {
            var h = d3.select('#' + id).select('.part' + d).append('g').attr('class', 'header');

            h.append('text').text(header[d]).attr('x', (me.options.header.labelPosition[d] - 5)).attr('y', -5);
            h.append('text').text('Count').attr('x', (me.options.header.valuePosition[d] - 10)).attr('y', -5);

            h.append('line').attr('x1', me.options.header.labelPosition[d] - 10).attr('y1', -2).attr('x2', me.options.header.barpercentColumn[d] + 10).attr('y2', -2)
                .attr('class', 'header-underscore');
        });
    }

    function edgePolygon(d) {
        return [0, d.y1, me.options.transitionWidth, d.y2, me.options.transitionWidth, d.y2 + d.h2, 0, d.y1 + d.h1].join(' ');
    }

    function transitionPart(data, id, p) {
        var mainbar = d3.select('#' + id).select('.part' + p).select('.mainbars').selectAll('.mainbar').data(data.mainBars[p]);

        mainbar.select('.mainrect').transition().duration(me.options.duration)
			.attr('y', function (d) { return d.middle - d.height / 2; })
            .attr('height', function (d) { return d.height; });

        mainbar.select('.barlabel').transition()
            .duration(me.options.duration)
            .attr('y', function (d) { return d.middle + 5; });

        mainbar.select('.barvalue')
            .transition()
            .duration(me.options.duration)
            .attr('y', function (d) { return d.middle + 5; }).text(function (d, i) { return d.value; });

        mainbar.select('.barpercent').transition().duration(me.options.duration)
			.attr('y', function (d) { return d.middle + 5; })
			.text(function (d, i) { return '(' + Math.round(100 * d.percent) + '%)'; });

        d3.select('#' + id).select('.part' + p)
                            .select('.subbars')
                            .selectAll('.subbar')
                            .data(data.subBars[p])
			                .transition()
                            .duration(me.options.duration)
			                .attr('y', function (d) { return d.y; })
                            .attr('height', function (d) { return d.h; });
    }

    function transitionEdges(data, id) {
        d3.select('#' + id).append('g')
                            .attr('class', 'edges')
                            .attr('transform', 'translate(' + me.options.rectangleWidth + ',0)');

        d3.select('#' + id).select('.edges').selectAll('.edge').data(data.edges)
			.transition().duration(me.options.duration)
			.attrTween('points', arcTween).style('opacity', function (d) { return (d.h1 == 0 || d.h2 == 0 ? 0 : 0.5); });
    }

    function transition(data, id) {
        transitionPart(data, id, 0);
        transitionPart(data, id, 1);
        transitionEdges(data, id);
    }

    biPartiteChart.draw = function (data, containerEl) {
        // creates root  svg element
        var svg = d3.select(containerEl)
           .append('svg')
              .attr('class', 'bipartite')
           .attr('width', me.options.width)
           .attr('height', (me.options.height + me.options.margin.b + me.options.margin.t))
           .append('g')
           .attr('transform', 'translate(' + me.options.margin.l + ',' + me.options.margin.t + ')');

        data.forEach(function (biP, s) {
            svg.append('g')
				.attr('id', biP.id)
				.attr('transform', 'translate(' + (550 * s) + ',0)');
            debugger;
            var visData = visualize(biP.data);
            drawPart(visData, biP.id, 0);
            drawPart(visData, biP.id, 1);
            drawEdges(visData, biP.id);
            drawHeader(biP.header, biP.id);

            [0, 1].forEach(function (p) {
                d3.select('#' + biP.id)
					.select('.part' + p)
					.select('.mainbars')
					.selectAll('.mainbar')
					.on('mouseover', function (d, i) { return biPartiteChart.selectSegment(data, p, i); })
					.on('mouseout', function (d, i) { return biPartiteChart.deSelectSegment(data, p, i); });
            });
        });
    };

    biPartiteChart.selectSegment = function (data, m, s) {
        data.forEach(function (k) {
            var newdata = { keys: [], data: [] };

            newdata.keys = k.data.keys.map(function (d) { return d; });
            newdata.data[m] = k.data.data[m].map(function (d) { return d; });
            newdata.data[1 - m] = k.data.data[1 - m].map(function (v) { return v.map(function (d, i) { return (s == i ? d : 0); }); });

            transition(visualize(newdata), k.id);

            var selectedBar = d3.select('#' + k.id)
                .select('.part' + m)
                .select('.mainbars')
                .selectAll('.mainbar')
                .filter(function (d, i) { return (i == s); });

            selectedBar.selectAll('.mainrect, .barlabel, .barvalue, .barpercent').classed('selected', true);
        });
    };

    biPartiteChart.deSelectSegment = function (data, m, s) {
        data.forEach(function (k) {
            transition(visualize(k.data), k.id);
            var selectedBar = d3.select('#' + k.id)
                                .select('.part' + m)
                                .select('.mainbars')
                                .selectAll('.mainbar')
                                .filter(function (d, i) { return (i == s); });
            selectedBar.selectAll('.mainrect, .barlabel, .barvalue, .barpercent')
                      .classed('selected', false);
        });
    };
    this.biPartiteChart = biPartiteChart;
}();
