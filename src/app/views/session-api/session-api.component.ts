import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { IncomingRequest } from 'src/app/shared/model/trace.model';
import { Utils } from 'src/app/shared/util';
import { StatsService } from 'src/app/shared/services/stats.service';
import { TraceService } from 'src/app/shared/services/trace.service';
import { EnvRouter } from '../session-detail/session-detail.component';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatInput } from '@angular/material/input';



@Component({
  templateUrl: './session-api.component.html',
  styleUrls: ['./session-api.component.scss']
})
export class SessionApiComponent implements OnInit, OnDestroy {
  utilInstance: Utils = new Utils();
  nameDataList: any[];
  displayedColumns: string[] = ['status', 'app_name', 'method/path', 'query', 'start', 'Durée', 'user'];
  dataSource: MatTableDataSource<IncomingRequest> = new MatTableDataSource();
  isLoading = true;
  serverNameIsLoading=true;
  statusFilter: string[] = [];
  subscriptions: Subscription[] = [];
  serverFilterForm = new FormGroup({
    nameControl: new FormControl([""]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null,[Validators.required]),
      end: new FormControl<Date | null>(null,[Validators.required]),
    }),
  });
  DEFAULT_START: Date;
  DEFAULT_END: Date;

  filterTable = new Map<string, any>();

  params: Partial<{ env: string, start: any, end: any, endExclusive: any, serveurs: string[] }> = {};

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private _router: EnvRouter,
    private _statsService: StatsService,
    private _traceService: TraceService,
    private _activatedRoute: ActivatedRoute,
    private _location: Location) {

    let now = new Date();
    this.DEFAULT_START = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    this.DEFAULT_END = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    this._activatedRoute.queryParams
      .subscribe({
        next: (params: Params) => {
          this.params.env = params['env'] || EnvRouter.DEFAULT_ENV;
          this.params.start = params['start'];
          this.params.end = params['end']
          this.params.serveurs = Array.isArray(params['name']) ? params['name'] : [params['name'] || ''];
          if(this.params.serveurs[0]!=''){
            this.patchServerValue(this.params.serveurs)
          }

          if (!this.params.start || !this.params.end) {
            this.params.start = this.DEFAULT_START.toISOString();
            this.params.end = this.DEFAULT_END.toISOString();
          }
          this.params.endExclusive = new Date(this.params.end);
          this.params.endExclusive.setDate(this.params.endExclusive.getDate() + 1);
          this.params.endExclusive = this.params.endExclusive.toISOString();

          this.patchDateValue(this.params.start, this.params.end);
          this.subscriptions.push(this._statsService.getIncomingRequest({ 'column.distinct': 'app_name','order': 'app_name.asc' })
            .subscribe({
              next: (appNames: { appName: string }[]) => {
                this.serverNameIsLoading=false;
                this.nameDataList = appNames.map(r => r.appName);
                this.patchServerValue(this.params.serveurs);
              },error: (e) => {
                this.serverNameIsLoading=false;
                console.log(e)
              }
            }));
          this.getIncomingRequest();

          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start}&end=${this.params.end}${this.params.serveurs[0] !== '' ? '&' + this.params.serveurs.map(name => `name=${name}`).join('&') : ''}`)
        }
      });
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  unsubscribe() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  search() {
    if(this.serverFilterForm.valid){
      let name = this.serverFilterForm.getRawValue().nameControl;
      let start = this.serverFilterForm.getRawValue().dateRangePicker.start.toISOString();
      let end = this.serverFilterForm.getRawValue().dateRangePicker.end.toISOString()
  
      if (this.params.start != start
        || this.params.end != end
        || !this.params?.serveurs?.every((element, index) => element === name[index])
        || name.length != this.params?.serveurs?.length) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { ...(name !== undefined && { name }), start: start, end: end }
        })
      } else {
        this.getIncomingRequest();
      }
    }
  }

  getIncomingRequest() {
    let params = {
      'env': this.params.env,
      'name': this.params.serveurs,
      'start': this.params.start,
      'end': this.params.endExclusive,
      'lazy': false
    };
    this.isLoading = true;
    this.dataSource = new MatTableDataSource([]);
    this.subscriptions.push(this._traceService.getIncomingRequestByCriteria(params)
      .subscribe({
        next: (d: IncomingRequest[]) => {
          if (d) {
            this.dataSource = new MatTableDataSource(d);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {

              if (columnName == "app_name") return row["application"]["name"] as string;
              if (columnName == "name/port") return row["host"] + ":" + row["port"] as string;
              if (columnName == "method/path") return row['path'] as string;
              if (columnName == "start") return row['start'] as string;
              if (columnName == "Durée") return (row["end"] - row["start"])

              var columnValue = row[columnName as keyof any] as string;
              return columnValue;

            }
            this.dataSource.filterPredicate = (data: IncomingRequest, filter: string) => {
              var map: Map<string, any> = new Map(JSON.parse(filter));
              let isMatch = true;
              for(let [key, value] of map.entries()){
                if(key == 'filter') {
                  isMatch = isMatch && (value == '' || (data.application.name?.toLowerCase().includes(value) || 
                    data.method?.toLowerCase().includes(value) || data.query?.toLowerCase().includes(value) || 
                    data.user?.toLowerCase().includes(value) || data.path?.toLowerCase().includes(value)));
                } else if (key == 'status'){
                  const s = data.status.toString();
                  isMatch = isMatch && (!value.length || (value.some((status: any) => {
                    return s.startsWith(status[0]);
                  })));
                }
              }
              return isMatch;
            }
            this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
            this.dataSource.paginator.pageIndex = 0;
          }
          this.isLoading = false;
        },
        error: err => {
          this.isLoading = false;
        }
      }));
  }


  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: new Date(start),
        end: new Date(end)
      }
    }, { emitEvent: false });
  }

  patchServerValue(servers: any[]) {
    this.serverFilterForm.patchValue({
      nameControl: servers
    })
  }

  selectedRequest(event: MouseEvent, row: any) {
    if (event.ctrlKey) {
      this._router.open(`#/session/api/${row}`, '_blank')
    } else {
      this._router.navigate(['/session/api', row], {
        queryParams: { 'env': this.params.env }
      });
    }
  }

  getElapsedTime(end: number, start: number,) {
    return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
  }

  statusBorder(status: number) {

    return this.utilInstance.statusBorder(status)
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterTable.set('filter', filterValue.trim().toLowerCase());
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleFilter(filter: string[]) {
    this.filterTable.set('status', filter);
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
  }
}


