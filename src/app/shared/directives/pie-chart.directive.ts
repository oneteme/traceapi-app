import { Directive, ElementRef, Input, OnDestroy, inject } from "@angular/core";
import { ChartConfig, ChartView, DataSet, mergeDeep } from "src/app/shared/directives/chart.model";


// TODO Gerer le assign en profondeur et trouver une autre modelisation que le xDim
@Directive({
    selector: '[pie-chart]'
})
export class PieChartDirective implements ChartView, OnDestroy {
    private el: ElementRef = inject(ElementRef);

    private _chart: ApexCharts;
    private _chartConfig: ChartConfig = {};
    private _options: any = {
        chart: {
            type: 'pie' // donut / radialBar / polarArea
        },
        series: []
    };

    @Input() set config(object: ChartConfig) {
        if (object) {
            this._chartConfig = object;
            mergeDeep(this._options, {
                title: {
                    text: this._chartConfig.title
                },
                subtitle: {
                    text: this._chartConfig.subtitle
                },
                xaxis: {
                    title: {
                        text: this._chartConfig.xtitle
                    }
                },
                yaxis: {
                    title: {
                        text: this._chartConfig.ytitle
                    }
                }
            }, this._chartConfig.options);
            this.updateChart();
        }
    }

    /* 
        exemple 1 : [{count1: 2, count3: 3, count4: 5}] => 3 yDim
        exemple 2 : [{count: 2, user: ""}, {count: 4, user: ""}] => 1yDim et 1xDim
        exemple 3 : [{count: 2, user: "1", status: "200"}, {count: 4, user: "1", status: "400"}] => 1yDim et 2xDim
        exemple 4 : [{count: 2, count2: 2, user: "1"}, {count: 4, count2: 2, user: "2"}] => 2yDim et 1xDim
        exemple 5 : [{count: 2, count2: 2, user: "1", status: "200"}, {count: 4, count2: 2, user: "1", status: "400"}] => 2yDim et 2xDim (TODO)
    */
    @Input() set data(objects: any[]) {
        let series: number[] = [];
        let labels: string[] = [];
        let colors: string[] = [];

        if (objects?.length) {
            let category = this._chartConfig.category;
            let mappers = this._chartConfig.mappers;

            if (category && mappers.length > 1) {
                throw Error('Plusieurs dimensions impossible');
            } else {
                let dataSet = category?.mapper ? new DataSet(objects, category.mapper) : new DataSet(objects, 'label', mappers);
                let data = dataSet.data(mappers, 0);
                series = data.flatMap(d => d.data);
                labels = dataSet.labels;
                colors = data.filter(d => d.mapper.color).map(d => d.mapper.color);
            }
        }
        mergeDeep(this._options, { series: series, labels: labels, colors: colors });
        this.updateChart();
    }

    @Input() set isLoading(val: boolean) {
        
        mergeDeep(this._options, {
            noData: {
                text: val ? 'Loading...' : 'Aucune donnée'
            }
        });
        this.updateChart();
    }

    ngOnDestroy(): void {
        this._chart.destroy();
    }

    updateChart() {
        if (this._chart) {
            this._chart.resetSeries();
            if (this._options.chart.id) {
                ApexCharts.exec(this._options.chart.id, 'updateOptions', this._options);
            } else {
                this._chart.updateOptions(this._options);
            }
        } else {
            this._chart = new ApexCharts(this.el.nativeElement, this._options);
            this._chart.render();
        }
    }
}