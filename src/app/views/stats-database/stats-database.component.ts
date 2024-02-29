import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, Subscription, catchError, combineLatest, finalize, forkJoin, observable, of } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
//import { Constants } from './constants';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { error } from 'console';
import { ChartConfig, DataMapper } from 'src/app/shared/directives/chart.model';
import { StatsService } from 'src/app/shared/services/stats.service';
import { EnvRouter } from '../session-detail/session-detail.component';
import { MatTableDataSource } from '@angular/material/table';
import { stat } from 'fs';
import { Constants } from '../constants';

@Component({
  templateUrl: './stats-database.component.html',
  styleUrls: ['./stats-database.component.scss']
})
export class StatsDatabaseComponent implements OnInit {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(Router);
  private _datePipe = inject(DatePipe);
  private _statsService = inject(StatsService);
  private _location = inject(Location);

  constants = Constants;

  serverFilterForm = new FormGroup({
    dbnameControl: new FormControl(""),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null,[Validators.required]),
      end: new FormControl<Date | null>(null,[Validators.required]),
    }),
  });

  env: any;
  dbNameDataList: any[];
  schema: any;
  dbNameListIsLoading: boolean = false
  dataIsLoading: boolean = false
  countOkKo: any[];
  countMinMaxAvg: any[];
  countRepartitionBySpeed: any[];
  exceptions: any[];
  dbInfo: any[] = [];
  userInfo: any[];
  doresetServerFormValue: boolean = false;
  DEFAULT_START: Date;
  DEFAULT_END: Date;

  displayedColumns: string[] = ['name'];
  dataSource: MatTableDataSource<{ name: string }> = new MatTableDataSource([]);

  requests: { [key: string]: { observable: Observable<Object>, data?: any[], isLoading?: boolean } } = {};
  subscriptions: Subscription[] = [];

  constructor() {
    let now = new Date();
    this.DEFAULT_START = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6);
    this.DEFAULT_END = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams
    }).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {

        this.schema = v.params.name;
        this.env = v.queryParams.env || EnvRouter.DEFAULT_ENV;
        let start = v.queryParams.start;
        let end = v.queryParams.end
        if (!start || !end) {
          start = this.DEFAULT_START.toISOString();
          end = this.DEFAULT_END.toISOString();
        }
        this.patchDateValue(start, end);
        this.init();
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${start}&end=${end}`)

      }, error: (err) => {
        console.log(err)
      }
    })
  }

  ngOnInit(): void {


  }

  setServerFormValue() {
    this.dbNameListIsLoading = true;
    this.serverFilterForm.controls.dbnameControl.reset();
    this.serverFilterForm.controls.dbnameControl.disable();
    this._statsService.getIncomingRequest({ 'column.distinct': 'query.schema&query.parent=request.id&order=query.schema.asc', 'request.environement': this.env }).pipe(catchError(error => of(error)))
      .subscribe({
        next: (res: { schema: string }[]) => {
          this.dbNameDataList = res.map((s: any) => s.schema)
          this.serverFilterForm.controls.dbnameControl.enable();
          this.dbNameListIsLoading = false;
          this.serverFilterForm.controls.dbnameControl.patchValue(this.schema)
        },
        error: err => {
          this.dbNameListIsLoading = false;
          this.serverFilterForm.controls.dbnameControl.enable();
          console.log(err)
        }
      });
  }

  search() {
    if(this.serverFilterForm.valid){
      let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
      let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
      if (start.toISOString() != this._activatedRoute.snapshot?.queryParams['start'] || end.toISOString() != this._activatedRoute.snapshot?.queryParams['end']) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { start: start.toISOString(), end: end.toISOString() }
        })
      } else {
        this.init();
      } 
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  init() {
    this.dataIsLoading = true;
    let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
    let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
    end.setDate(end.getDate() + 1);
    this.requests = this.DB_REQUEST(this.schema, this.env, start, end)
    Object.keys(this.requests).forEach(k => {
      this.requests[k].data = [];
      this.requests[k].isLoading = true;
      this.subscriptions.push(this.requests[k].observable.pipe(finalize(() => this.requests[k].isLoading = false))
        .subscribe({
          next: (res: any) => {
            this.requests[k].data = res;
          }
        }))
    })
  }


  DB_REQUEST = (schema: string, env: string, start: Date, end: Date) => {
    let now = new Date();
    return {
      dbInfo: { observable: this._statsService.getIncomingRequest({ 'column.distinct': 'query.host,query.schema,query.driver,query.db_name,query.db_version', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString(), 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString() }) },
      countOkKoSlowest: { observable: this._statsService.getIncomingRequest({ 'column': 'query.count_db_error:countErrorServer,query.count:count,query.count_slowest:countSlowest,query.start.date:date', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'request.start.le': now.toISOString(), 'query.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(), 'query.start.le': now.toISOString() }) },
      countMinMaxAvg: { observable: this._statsService.getIncomingRequest({ 'column': 'query.count_db_succes:countDbSucces,query.elapsedtime.max:max,query.elapsedtime.avg:avg,query.start.date:date', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }) },
      countRepartitionBySpeedBar: { observable: this._statsService.getIncomingRequest({ 'column': 'query.count_slowest:elapsedTimeSlowest,query.count_slow:elapsedTimeSlow,query.count_medium:elapsedTimeMedium,query.count_fast:elapsedTimeFast,query.count_fastest:elapsedTimeFastest,query.start.date:date', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }) },
      countRepartitionBySpeedPie: { observable: this._statsService.getIncomingRequest({ 'column': 'query.count_slowest:elapsedTimeSlowest,query.count_slow:elapsedTimeSlow,query.count_medium:elapsedTimeMedium,query.count_fast:elapsedTimeFast,query.count_fastest:elapsedTimeFastest', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }) },
      exceptions: { observable: this._statsService.getIncomingRequest({ 'column': 'count,dbaction.err_type.coalesce(null),dbaction.err_msg.coalesce(null)', 'dbaction.err_type.not': 'null', 'dbaction.err_msg.not': 'null', 'dbaction.parent': 'query.id', 'query.parent': 'request.id', 'order': 'count.desc', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }) },
      usersInfo: { observable: this._statsService.getIncomingRequest({ 'column': 'count:countRows,query.user', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }) }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: new Date(start),
        end: new Date(end)
      }
    }, { emitEvent: false });
  }

  usersInfoChartConfig: ChartConfig = {
    title: 'Nombre d\'appels par utilisateur',
    subtitle: '',
    category: { 'type': 'string', 'mapper': 'user' },
    xtitle: '',
    ytitle: '',
    mappers: [{ field: "countRows", label: "Nombre de requêtes" }],
    options: {
      series: [],
      chart: {
        type: 'bar',
        height: 350
      }, xaxis: {
        type: 'category'
      },
      legend: {
        position: 'right',
        offsetX: 0,
        offsetY: 50
      },
      tooltip: {
        shared: true,
        intersect: false,
      }
    }
  }

}