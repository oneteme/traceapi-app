import { Component, Input } from "@angular/core";
import { ChartConfig, ChartType } from "../chart.model";

@Component({
    selector: 'chart', 
    templateUrl: './chart.component.html'
})
export class ChartComponent {
    @Input() type: ChartType;
    @Input() config: ChartConfig;
    @Input() data: any[];
    @Input() isLoading: boolean;
}