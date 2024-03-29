import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { EnvRouter } from "../session-detail/session-detail.component";
import { StatsService } from "src/app/shared/services/stats.service";
import { Location} from '@angular/common';
import { ActivatedRoute, Params } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, Subscription, combineLatest, filter, finalize, map } from "rxjs";
import { Constants } from "../constants";
import { groupingBy } from "src/app/shared/util";

@Component({
    templateUrl: './stats-api.component.html',
    styleUrls: ['./stats-api.component.scss']
})
export class StatsApiComponent implements OnInit, OnDestroy {
    constants = Constants
    private _activatedRoute = inject(ActivatedRoute);
    private _statsService = inject(StatsService);
    private _router = inject(EnvRouter);
    private _location = inject(Location);
    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    subscriptions: Subscription[] = [];

    env: any;
    name: string;
    start: any;
    end: any;
    DEFAULT_START:Date;
    DEFAULT_END:Date;

    requests: { [key: string]: { observable: Observable<Object>, data?: any[], isLoading?: boolean } } = {};

    constructor() {
        let now = new Date();
        this.DEFAULT_START = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6);
        this.DEFAULT_END = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());


        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.name = v.params.name;
                this.env = v.queryParams.env || EnvRouter.DEFAULT_ENV;
                this.start = v.queryParams.start;
                this.end = v.queryParams.end
                if (!this.start || !this.end) {
                  this.start =  this.DEFAULT_START.toISOString();
                  this.end = this.DEFAULT_END.toISOString();
                }
                this.patchDateValue(this.start, this.end) ;
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${this.start}&end=${this.end}`);
            }
        });

    }

    ngOnInit() {

    }

    ngOnDestroy(): void {
        this.unsubscribe();
    }


    init(): void {
        let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
        let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
        end.setDate(end.getDate() + 1);
        this.requests = this.API_REQUEST(this.name, this.env, start, end);
        Object.keys(this.requests).forEach(k => {
            this.requests[k].data = [];
            this.requests[k].isLoading = true;
            this.subscriptions.push(this.requests[k].observable
                .pipe(finalize(() => this.requests[k].isLoading = false))
                .subscribe({
                    next: (res: any) => {
                        this.requests[k].data = res;
                    }
                }));
        });
    }

    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    search() {
        if(this.serverFilterForm.valid){
            let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
            let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
            if(start.toISOString() != this._activatedRoute.snapshot?.queryParams['start'] || end.toISOString() != this._activatedRoute.snapshot?.queryParams['end']){
                this._router.navigate([],{
                    relativeTo: this._activatedRoute,
                    queryParamsHandling: 'merge',
                    queryParams: { start: start.toISOString(), end: end.toISOString()}
                })
            }else {
            this.init();
            }
        }
    }

    patchDateValue(start: Date, end: Date){
        this.serverFilterForm.patchValue({
          dateRangePicker: {
            start: new Date(start),
            end: new Date(end)
          }
        }, { emitEvent: false });
      }

    onClickRow(event: MouseEvent, row: any) {
        if( event.ctrlKey){
            this._router.open(`#/dashboard/api/${row.name}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`,'_blank')
          }else {
            this._router.navigate(['/dashboard/api', row.name], {
              queryParamsHandling: 'preserve'
            });
        }
    }

    API_REQUEST = (name: string, env: string, start: Date, end: Date) => {
        let now = new Date();
        return {
            infos: { observable: this._statsService.getIncomingRequest({ 'column.distinct': "app_name", 'api_name': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString() }) },
            repartitionTimeAndTypeResponse: { observable: this._statsService.getIncomingRequest({ 'column': "count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,count_succes:countSucces,count_error_server:countErrorServer,count_error_client:countErrorClient", 'api_name': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env }) },
            repartitionTimeAndTypeResponseByPeriod: { observable: this._statsService.getIncomingRequest({ 'column': "count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.date:date", 'api_name': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env, 'order': 'start.date.asc' }) },
            repartitionRequestByPeriodLine: { observable: this._statsService.getIncomingRequest({ 'column': "count:count,count_error_server:countErrorServer,count_slowest:countSlowest,start.date:date", 'api_name': name, 'start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'start.le': now.toISOString(), 'environement': env, 'order': 'start.date.asc' }) }, // 7 derniers jours
            repartitionUserPolar: { observable: this._statsService.getIncomingRequest({ 'column': "count:count,user:user", 'api_name': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env, 'user.not': 'null', 'order': 'count.desc' }).pipe(map((r: any[]) => r.slice(0, 5))) },
            repartitionUserBar: { observable: this._statsService.getIncomingRequest({ 'column': "count:count,start.date:date,user:user", 'api_name': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env, 'user.not': 'null', 'order': 'start.date.desc' }).pipe(map((r: any[]) => {
                let groupBy = groupingBy(r, 'user');
                let results: {count: number, user: string, date: any}[] = Object.entries(groupBy).map((value: [string, any[]]) => {
                    return {
                        totalCount: value[1].reduce((acc: number, o) => {
                            return acc + o['count'];
                        }, 0),
                        user: value[0],
                        data: value[1]
                    }
                }).sort((a, b) => {
                    return b.totalCount - a.totalCount 
                }).slice(0, 5).flatMap(r => r.data);
                return results;
            })) },
            dependentsTable: { observable: this._statsService.getIncomingRequest({ 'column': "count:count,count_succes:countSucces,count_error_client:countErrClient,count_error_server:countErrServer,request2.api_name:name", "request.id": "out.parent", "out.id": "request2.id", 'request.api_name': name, 'request.start.ge': start.toISOString(), 'request.start.le': end.toISOString(), 'request2.start.ge': start.toISOString(), 'request2.start.le': end.toISOString(), 'environement': env, 'request2.api_name.not': 'null', 'order': 'count.desc' }) },
            dependenciesTable: { observable: this._statsService.getIncomingRequest({ 'column': "count:count,count_succes:countSucces,count_error_client:countErrClient,count_error_server:countErrServer,request.api_name:name", "request.id": "out.parent", "out.id": "request2.id", 'request2.api_name': name, 'request2.start.ge': start.toISOString(), 'request2.start.le': end.toISOString(), 'request.start.ge': start.toISOString(), 'request.start.le': end.toISOString(), 'environement': env, 'request.api_name.not': 'null', 'order': 'count.desc' }) },
            exceptionsTable: { observable: this._statsService.getIncomingRequest({ 'column': 'count,err_type.coalesce(null),err_msg.coalesce(null)', 'err_type.not': 'null', 'err_msg.not': 'null', "environement": env, "api_name": name, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'count.desc' }).pipe(map((d: any) => d.slice(0, 5))) }
        };
    }
}