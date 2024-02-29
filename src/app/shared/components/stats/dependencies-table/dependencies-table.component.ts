import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { ChartConfig } from "src/app/shared/directives/chart.model";


@Component({
    selector: 'dependencies-table',
    templateUrl: './dependencies-table.component.html',
    styleUrls: ['./dependencies-table.component.scss'],
})
export class DependenciesTableComponent {

    displayedColumns: string[] = ['name', 'response'];
    dataSource: MatTableDataSource<{ name: string, count: number, data: any[] }> = new MatTableDataSource([]);

    readonly CONFIG_SPARKLINE: ChartConfig = {
        mappers: [
            {field: 'countSucces', 'label': '2xx', color: '#33cc33' },
            {field: 'countErrClient', 'label': '4xx', color: '#ffa31a' },
            {field: 'countErrServer', 'label': '5xx', color: '#ff0000' }
        ],
        options: {
            chart: {
                type: 'donut',
                width: 50,
                height: 50,
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            value: {
                                fontSize: '9px',
                                offsetY: -12
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: ''
                            }
                        }
                    }
                }
            },
            tooltip: {
                enabled: true,
                fixed: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            }
        }
    };

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @Input() set data(objects: any[]) {
        if (objects?.length) {
            this.dataSource = new MatTableDataSource(objects.map(r => {
                return { name: r.name, count: r.count, data: [r] };
            }));
            this.dataSource.paginator = this.paginator;
        } else {
            this.dataSource = new MatTableDataSource([]);
        }
    }

    @Input() isLoading: boolean;

    @Output() onClickRow: EventEmitter<{event: MouseEvent, row: any}> = new EventEmitter();

    onClick(event:MouseEvent, row: any) {
        this.onClickRow.emit({event: event, row: row});
    }
}