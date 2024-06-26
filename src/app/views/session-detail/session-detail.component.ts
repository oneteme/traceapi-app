import { AfterContentInit, Component, ElementRef, Injectable, NgZone, OnDestroy, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, NavigationExtras, Router} from '@angular/router';
import { Observable, combineLatest} from "rxjs";
import { Timeline } from 'vis-timeline';
import {  OutcomingQuery, OutcomingRequest, RunnableStage } from 'src/app/shared/model/trace.model';
import { Utils } from 'src/app/shared/util';
import { DatePipe, Location} from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TraceService } from 'src/app/shared/services/trace.service';
import { application } from 'src/environments/environment';


export interface UserData {
    id: string;
    name: string;
    progress: string;
    fruit: string;
}

@Component({
    templateUrl: './session-detail.component.html',
    styleUrls: ['./session-detail.component.scss'],

})
export class SessionDetailComponent implements AfterContentInit, OnDestroy {

    UtilInstance: Utils = new Utils();
    outcomingRequestDisplayedColumns: string[] = ['Status', 'host', 'path', 'start', 'duree'];
    outcomingQueryDisplayedColumns: string[] = ['Status', 'host', 'schema', 'start', 'duree', 'db']
    outcomingRequestdataSource: MatTableDataSource<OutcomingRequest> = new MatTableDataSource();
    outcomingQuerydataSource: MatTableDataSource<any>;
    selectedSession: any // IncomingRequest | Mainrequest | OutcomingRequest;
    selectedSessionType: string;
    outcomingRequestList: any;
    outcomingQueryList: any;
    isComplete: boolean = true;
    isLoading: boolean = false;
    data: any[];
    chartOp: any;
    resizeSubscription: any;
    paramsSubscription: any;
    chart: any;
    options: any;
    container: any;
    dataTable: any;
    timeLine: any;
    queryBySchema :any[];
    env:any;
    pipe = new DatePipe('fr-FR')
    @ViewChild('timeline') timelineContainer: ElementRef;
    @ViewChild('OutcomingRequestPaginator') outcomingRequestPaginator: MatPaginator;
    @ViewChild('OutcomingRequestSort') outcomingRequestSort: MatSort;
    @ViewChild('OutcomingQueryPaginator') outcomingQueryPaginator: MatPaginator;
    @ViewChild('OutcomingQuerySort') outcomingQuerySort: MatSort;


    constructor(private _activatedRoute: ActivatedRoute,
        private _traceService: TraceService,
        public dialog: MatDialog,
        private zone: NgZone,
        private _router: EnvRouter,
        private _location: Location) {

        this.paramsSubscription = combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.selectedSessionType = params.type;
                this.getSessionById(params.id);
                this.env = queryParams.env || application.default_env;
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

    ngAfterContentInit(): void {
        /*this._activatedRoute.paramMap.subscribe((paramsList: any) => {
            this.selectedSessionType = paramsList.params['type'];
            this.getSessionById(paramsList.params['id']);
        })*/
    }






    getSessionById(id: string) {

        this.isLoading = true;
        (this.selectedSessionType == 'main' ? this._traceService.getMainRequestById(id) : this._traceService.getIncomingRequestById(id)).subscribe({
            next: (d: any) => {
                this.selectedSession = d;
                if (this.selectedSession) {
                    this.selectedSession.type = this.selectedSessionType;
                    
                    this.outcomingRequestList = this.selectedSession.requests;
                    this.outcomingRequestdataSource = new MatTableDataSource(this.outcomingRequestList);
                    setTimeout(() => { this.outcomingRequestdataSource.paginator = this.outcomingRequestPaginator });
                    setTimeout(() => { this.outcomingRequestdataSource.sort = this.outcomingRequestSort });
                    this.outcomingRequestdataSource.sortingDataAccessor = (row: any, columnName: string) => {
                        if (columnName == "host") return row["host"] + ":" + row["port"] as string;
                        if (columnName == "start") return row['start'] as string;
                        if (columnName == "duree") return (row["end"] - row["start"]);
                        var columnValue = row[columnName as keyof any] as string;
                        return columnValue;
                    }
                    this.outcomingQueryList = this.selectedSession.queries
                    this.outcomingQuerydataSource = new MatTableDataSource(this.outcomingQueryList);
                    setTimeout(() => { this.outcomingQuerydataSource.paginator = this.outcomingQueryPaginator });
                    setTimeout(() => { this.outcomingQuerydataSource.sort = this.outcomingQuerySort });
                    this.outcomingQuerydataSource.sortingDataAccessor = (row: any, columnName: string) => {
                        if (columnName == "duree") return (row["end"] - row["start"])
                        var columnValue = row[columnName as keyof any] as string;
                        return columnValue;
                    }
                    
                    this.groupQueriesBySchema();
                    this.configDbactions(this.selectedSession)
                    
                    this.visjs();
                    this.isLoading = false;
                    this.isComplete = true;
                } else {
                    this.isLoading = false;
                    this.isComplete= false;
                    // navigate to tab incoming
                }
            },
            error: err => {
                this.isLoading = false;
            }
        });
    }

    visjs() {
        
        let timeline_end = +this.selectedSession.end * 1000
        let timeline_start = +this.selectedSession.start * 1000
        let dataArray: any = [...<OutcomingRequest[]>this.selectedSession.requests,
        ...<OutcomingQuery[]>this.selectedSession.queries,
        ...<RunnableStage[]>this.selectedSession.stages.map((s: any) => ({ ...s, isStage: true }))];
        dataArray.splice(0, 0, {...this.selectedSession,isStage: true})
        this.sortInnerArrayByDate(dataArray);


        let data: any;
        let groups: any;
        let isWebapp = false, title = '';
        if (this.selectedSessionType === "main" && this.selectedSession.launchMode === "WEBAPP") {
            groups = [{ id: 0, content: this.selectedSession?.application?.re }];
            title = 'path';
            isWebapp = true;
        } else {
            groups = new Set();
            dataArray.forEach((c: any, i: number) => {
                groups.add(c['threadName'])
            });
            title = 'threadName';
            groups = Array.from(groups).map((g: string) => ({ id: g, content: g }))
        }
        data = dataArray.map((c: any, i: number) => {
            let o = {
                id: c.hasOwnProperty('schema') ? -i : c.id,
                group: isWebapp ? 0 : c.threadName,
                content:c.hasOwnProperty('isStage') ? '' : (c.schema || c.host || 'N/A'),
                start: c.start * 1000,
                end: c.end * 1000,
                title: `<span>${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(c.end * 1000), 'HH:mm:ss.SSS')}</span><br>
                <h4>${c[title]}:  ${this.getElapsedTime(c.end, c.start).toFixed(3)}s</h4>`,
                className: c.hasOwnProperty('schema') ? "bdd" : !c.hasOwnProperty('isStage')  ? "rest" : "",
                type: c.hasOwnProperty('isStage')  ? 'background' : 'range'
            }
            if (o.end > timeline_end){
                timeline_end = o.end
            }      
            return o;
        })


        if (this.timeLine) {  // destroy if exists 
            this.timeLine.destroy();
        }
        // Create a Timeline
        this.timeLine = new Timeline(this.timelineContainer.nativeElement, data, groups
            , {
                min: timeline_start,
                max: timeline_end,
                clickToUse: true,
                tooltip: {
                    followMouse: true
                },
                margin: {
                    item: {
                        horizontal: -1
                    }
                },
                order: (a, b) => {
                    return b.start - a.start // inverser l'ordre  
                }
            });

        let that = this;
        this.timeLine.on('select', function (props: any) {
            let id = props.items[0];
            if (isNaN(+id)) {
                that._router.navigate(['/session', 'api', id]);
            }
        });

        if (timeline_end != +this.selectedSession.end * 1000) {
            this.timeLine.addCustomTime(+this.selectedSession.end * 1000, "async");
            this.timeLine.setCustomTimeMarker("async", "async");
        }

    }

    selectedRequest(event:MouseEvent,row: any) {
        if(row){
            if( event.ctrlKey){
                this._router.open(`#/session/api/${row}`,'_blank')
              }else {
                  this._router.navigate(['/session', 'api', row]);
              }
        }
      
    }

    getElapsedTime(end: number, start: number,) {
        // return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
        return end - start;

    }

    getRe(re: string) {
        return this.UtilInstance.getRe(re);
    }

    statusBorder(status: any) {
        return this.UtilInstance.statusBorder(status);
    }


    getSessionDetailBorder(session: any) {

        if (session?.type == "api" || session?.type == "outcoming")
            return this.UtilInstance.statusBorderCard(session.status)
        if (session?.type == "main")
            return this.UtilInstance.statusBorderCard(!!session.exception.message)

    }

    getSessionStatusTooltip(session: any) {
        if (session?.type == "api" || session?.type == "outcoming")
            return session?.status;
        if (session?.type == "main")
            return !session.exception.message ? "réussi" : "échoué";
    }


    configDbactions(session: any) {
        session.queries.forEach((query: any) => {
            query.actions.forEach((db: any, i: number) => {
                if (query.actions[i + 1]) {
                    let diffElapsed = new Date(db.end * 1000).getTime() - new Date(query.actions[i + 1].start * 1000).getTime();

                    if (diffElapsed != 0) {
                        query.actions.splice(i + 1, 0, { 'type': ' ', 'exception': { 'classname': null, 'message': null }, 'start': db.end, 'end': query.actions[i + 1].start })
                    }
                }
            });

        });
    }

    groupQueriesBySchema(){
        if(this.selectedSession.queries){
            this.queryBySchema =  this.selectedSession.queries.reduce((acc: any, item: any) => {
                if(!acc[item['schema']]){
                    acc[item['schema']] = []
                }

                acc[item['schema']].push(item);
                return acc;
            },[]);
        }
    }

    getSessionUrl(selectedSession: any) {
        return this.UtilInstance.getSessionUrl(selectedSession);
    }

    navigate(event:MouseEvent,targetType: string,extraParam?:string) {
        let params: any[] = [];
        switch (targetType) {
            case "api":
                params.push('dashboard', 'api', this.selectedSession.name);
                break;
            case "app":
                params.push('dashboard', 'app', this.selectedSession.application.name)
                break;
            case "tree":
                params.push('session/api', this.selectedSession.id, 'tree')
                break;
        }
        if(event.ctrlKey){
           this._router.open(`#/${params.join('/')}`,'_blank')
          }else {
            this._router.navigate(params, {
                queryParams: { env: this.selectedSession?.application?.env }
            });
        }
    }

    sortInnerArrayByDate(innerArray: any[]): any[] {
        return innerArray.sort((a, b) => {
            if (a.start > b.start)
                return 1;

            if (a.start < b.start)
                return -1;

            if (a.threadName && b.threadName)
                return a.threadName.localeCompare(b.threadName)

        });
    }

    ngOnDestroy() {
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
        if (this.paramsSubscription) {
            this.paramsSubscription.unsubscribe();
        }
    }






}

@Injectable()
export class EnvRouter {
   
    private _env: string;

    constructor(private router: Router) { }

    set env(env: string) {
        this._env = env
    }

    get events(): Observable<any>{
        return this.router.events;
    };

    get url(): string {
        return this.router.url;
    }
    

    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        if (!extras?.queryParams?.env) {
            if (this._env) {
                if (!extras) {
                    extras = {}
                }
                if (!extras.queryParams) {
                    extras.queryParams = {}
                }
                extras.queryParams.env = this._env;
            }
        }
        else {
            this.env = extras.queryParams.env;
        }
        return this.router.navigate(commands, extras);
        // return Promise.resolve(true);
    }

    open(url?: string | URL, target?: string, features?: string): WindowProxy | null{
        return window.open(url,target,features);
    }
    
}