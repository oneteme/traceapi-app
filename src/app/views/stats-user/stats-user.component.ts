import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { EnvRouter } from "../session-detail/session-detail.component";
import { StatsService } from "src/app/shared/services/stats.service";
import { ActivatedRoute, Params } from "@angular/router";
import { Location} from '@angular/common';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, Subscription, combineLatest, finalize, map } from "rxjs";
import { Constants } from "../constants";

@Component({
    templateUrl: './stats-user.component.html',
    styleUrls: ['./stats-user.component.scss']
})
export class StatsUserComponent implements OnInit, OnDestroy {
    constants = Constants;
    private _activatedRoute = inject(ActivatedRoute);
    private _statsService = inject(StatsService);
    private _router = inject(EnvRouter);
    private _location= inject(Location); 

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    subscriptions: Subscription[] = [];

    env: any;
    name: string;
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
                let start = v.queryParams.start;
                let end = v.queryParams.end
                if (!start || !end) {
                  let now = new Date();
                  start = this.DEFAULT_START.toISOString();
                  end = this.DEFAULT_END.toISOString();
                }
                this.patchDateValue(start,end) ;
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${start}&end=${end}`)
            }
        });

    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    init(): void {
        let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
        let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
        end.setDate(end.getDate() + 1);
        this.requests = this.USER_REQUEST(this.name, this.env, start, end);
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

    // Stats en fonction du navigateur et du systeme
    USER_REQUEST = (name: string, env: string, start: Date, end: Date) => {
        let now = new Date();
        return {
            repartitionTimeAndTypeResponse: { observable: this._statsService.getIncomingRequest({ 'column': "count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,count_succes:countSucces,count_error_server:countErrorServer,count_error_client:countErrorClient", 'user': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env }) },
            repartitionTimeAndTypeResponseByPeriod: { observable: this._statsService.getIncomingRequest({ 'column': "count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.date:date", 'user': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env, 'order': 'start.date.asc' }) },
            repartitionRequestByPeriodLine: { observable: this._statsService.getIncomingRequest({ 'column': "count:count,count_error_server:countErrorServer,count_slowest:countSlowest,start.date:date", 'user': name, 'start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'start.le': now.toISOString(), 'environement': env, 'order': 'start.date.asc' }) },
            repartitionApiBar: { observable: this._statsService.getIncomingRequest({ 'column': "count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,api_name", 'user': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env, 'api_name.not': 'null', 'order': 'count.desc' }).pipe(map((d: any) => d.slice(0, 4))) },
            exceptionsTable: { observable: this._statsService.getIncomingRequest({ 'column': 'count,err_type.coalesce(null),err_msg.coalesce(null)', 'err_type.not': 'null', 'err_msg.not': 'null', "environement": env, 'user': name, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'count.desc' }).pipe(map((d: any) => d.slice(0, 4))) },
            sessionTable: { observable: this._statsService.getSession({ 'column': "name,start:date,elapsedtime,location,app_name", 'user': name, 'start.ge': start.toISOString(), 'start.le': end.toISOString(), 'environement': env, 'order': 'start.date.desc' }) }
        };
    }
}