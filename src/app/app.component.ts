import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { distinctUntilChanged, filter, skip } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EnvRouter } from './views/session-detail/session-detail.component';
import { MatDrawer } from '@angular/material/sidenav';
import { StatsService } from './shared/services/stats.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']

})

export class AppComponent implements OnInit {
  @ViewChild('drawer') drawer: MatDrawer;
  env: FormControl<string> = new FormControl(EnvRouter.DEFAULT_ENV);
  envs: any[];

  constructor(private activatedRoute: ActivatedRoute,
    private router: EnvRouter,
    private service: StatsService) {
    
    // this.service.getIncomingRequest({'column.distinct': 'environement', 'order': 'environement.asc'})
    //   .subscribe({
    //     next: (res: {environement: string}[]) => {
    //       this.envs = res.map(r => {r .environement});
    //     }
    //   });
    this.env.valueChanges
      .pipe(
        distinctUntilChanged((previous: string, current: string) => {
          return previous == current;
        }))
      .subscribe({
        next: res => {
          this.router.navigate([], {
            queryParamsHandling: 'merge',
            queryParams: { env: res }
          });
        }
      });

    this.activatedRoute.queryParams
      .subscribe({
        next: res => { // TODO  res.env always undefined 
          let r = this.activatedRoute.snapshot.queryParams['env'];
          if(!r){
            r = EnvRouter.DEFAULT_ENV;
          }
          if (this.env.value != r) {
            this.env.setValue(r, { emitEvent: false });
          }
        }
      });

    this.router.events.subscribe((event: NavigationEnd) => { //add to envRouter
      this.drawer.close();
    })
  }

  ngOnInit(): void {
    if (!localStorage.getItem('server')) {
      localStorage.setItem('server', environment.url);
    }
  }

  ngAfterViewInit() {

  }
}
