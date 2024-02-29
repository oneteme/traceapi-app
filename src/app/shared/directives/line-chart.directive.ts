import { Directive, ElementRef, Input, OnDestroy, ViewChild, inject } from "@angular/core";
import { ChartConfig, ChartView, DataMapper, DataSet, mergeDeep, toCategoriesFn } from "./chart.model";



@Directive({
  selector: '[line-chart]'
})
export class LineChartDirective implements ChartView, OnDestroy {
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartConfig = {};
  private _options: any = {
    series: [],
    chart: {
      type: 'line'
    }
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
          },
          tickPlacement: 'between'
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

  @Input() set data(objects: any[]) {
    let series: any[] = [];
    let categories: any[] = [];
    let type: 'category' | 'datetime' | 'numeric';
    if (objects?.length) {

      let category = this._chartConfig.category;
      let mappers = this._chartConfig.mappers;

      let dataSet = new DataSet(objects, category?.mapper);

      series = dataSet.data(mappers, 0).map(d => ({name: d.mapper.label, color: d.mapper.color, data: d.data}));
      
      // series = mappers.map(m => ({
      //   name: m.label, color: m.color, data: objects.map(o => {
      //     if (o[m.field] == undefined || o[m.field] == null) {
      //       throw new Error(`Field [${m.field}] does not exist`);
      //     }
      //     return o[m.field];
      //   })
      // }));
      categories = dataSet.labels;
      type = category.type == 'date' ? 'datetime' :
        category.type == 'string' ? 'category' : 'numeric';
    }
    mergeDeep(this._options, { series: series, xaxis: { type: type, categories: categories, overwriteCategories: categories } });
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