import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPageComponent } from './components/header-page/header-page.component';
import { MaterialModule } from '../app.material.module';
import { LineChartDirective } from './directives/line-chart.directive';
import { TreemapChartDirective } from './directives/treemap-chart.directive';

import { PieChartDirective } from './directives/pie-chart.directive';
import { BarChartDirective } from './directives/bar-chart.directive';
import { ChartComponent } from './directives/chart/chart.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule
  ],
  declarations: [
    HeaderPageComponent,
    ChartComponent,
    LineChartDirective,
    TreemapChartDirective,
    PieChartDirective,
    BarChartDirective
  ],
  exports: [
    HeaderPageComponent,
    ChartComponent,
    PieChartDirective,
    LineChartDirective,
    TreemapChartDirective,
    BarChartDirective
  ]
})
export class SharedModule { }
