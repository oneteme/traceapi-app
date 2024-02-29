import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class StatsService { 
    constructor(private http: HttpClient) {

    }

    getIncomingRequest(params: any) {
        let url = `${localStorage.getItem('server')}/stat/incoming/request`;
        return this.http.get(url, { params: params });
    }

    getSession(params: any) {
        let url = `${localStorage.getItem('server')}/stat/session`;
        return this.http.get(url, { params: params });
    }
}