import { Directive, ElementRef, Input, OnDestroy, inject } from "@angular/core";
import { ChartConfig, ChartView, mergeDeep, toCategoriesFn } from "./chart.model";
import * as ApexCharts from "apexcharts";


// Mettre a niveau avec les autres component 
@Directive({
  selector: '[treemap-chart]'
})
export class TreemapChartDirective implements ChartView, OnDestroy {
  private el: ElementRef = inject(ElementRef);

  private _chart: ApexCharts;
  private _chartConfig: ChartConfig = {};
  private _options: any = {
    chart: {
      type: 'treemap'
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

  @Input() set data(objects: any[]) {

    if (objects?.length) {
      let series: any[] = [];
      let categories: string[] = [];
      let categ = toCategoriesFn(this._chartConfig.category?.mapper);
      let type: 'category' | 'datetime' | 'numeric' = 'numeric';

      series = this._chartConfig.mappers.map((a) => ({
        name: a.label,
        color: a.color,
        data: objects.map((o) => o[a.field])
      }))

      if (categ) {

        type = this._chartConfig.category.type === 'date' ? 'datetime' : this._chartConfig.category.type === 'string' ? 'category' : 'numeric';
        categories = objects.map((o) => categ(o));
      }

      mergeDeep(this._options, {
        series: series,
        xaxis: {
          type: type,
          categories: categories
        }
      });
      this.updateChart();
    }
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