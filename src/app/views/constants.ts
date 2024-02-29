import { ChartConfig } from "src/app/shared/directives/chart.model";

export class Constants {

    static readonly REPARTITION_TYPE_RESPONSE_PIE: ChartConfig = {
        title: 'Nombre d\'appels par type de réponse',
        mappers: [
            { field: 'countSucces', label: '2xx', color: '#33cc33' },
            { field: 'countErrorClient', label: '4xx', color: '#ffa31a' },
            { field: 'countErrorServer', label: '5xx', color: '#ff0000' }
        ],
        options: {
            chart: { height: 250 },
            legend: {
                height: 225
            }
        }
    };

    static readonly REPARTITION_SPEED_PIE: ChartConfig = {
        mappers: [
            { field: 'elapsedTimeSlowest', label: '> 10', color: '#848383' },
            { field: 'elapsedTimeSlow', label: '5 <> 10', color: '#8397A1' },
            { field: 'elapsedTimeMedium', label: '3 <> 5', color: '#83ACBF' },
            { field: 'elapsedTimeFast', label: '1 <> 3', color: '#82C0DC' },
            { field: 'elapsedTimeFastest', label: '< 1', color: '#81D4FA' }
        ],
        options: {
            chart: { height: 250 },
            legend: {
                height: 225
            }
        }
    };

    static readonly REPARTITION_USER_POLAR: ChartConfig = {
        title: 'Nombre d\'appels par utilisateur',
        category: {
            type: 'string',
            mapper: 'user'
        },
        mappers: [
            { field: 'count', label: 'Total' }
        ],
        options: {
            chart: { height: 250 },
            legend: {
                height: 225
            }
        }
    };

    static readonly REPARTITION_USER_BAR: ChartConfig = {
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'count', stack: 'user' }
        ],
        options: {
            chart: {
                height: 250,
                type: 'bar',
                stacked: true
            },
            tooltip: {
                shared: true,
                intersect: false,
                followCursor: true
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false
                }
            },
            legend: {
                position: 'right',
                offsetY: 40
            }
        }
    }

    static readonly REPARTITION_API_BAR: ChartConfig = {
        title: 'Nombre d\'appels par Api (Top 5)',
        category: {
            type: 'string',
            mapper: 'apiName'
        },
        mappers: [
            { field: 'countSucces', label: '2xx', color: '#33cc33' },
            { field: 'countErrorClient', label: '4xx', color: '#ffa31a' },
            { field: 'countErrorServer', label: '5xx', color: '#ff0000' }
        ],
        options: {
            chart: {
                height: 300,
                stacked: true
            },
            tooltip: {
                shared: true,
                intersect: false,
                followCursor: true
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    dataLabels: {
                        total: {
                            enabled: true,
                            offsetX: 0,
                            style: {
                                fontSize: '13px',
                                fontWeight: 900
                            }
                        }
                    }
                },
            },
            fill: {
                opacity: 1
            },
            stroke: {
                width: 1,
                colors: ['#fff']
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left',
                offsetX: 40
            }
        }
    };

    static readonly REPARTITION_SPEED_BAR: ChartConfig = {
        title: 'Nombre d\'appels par tranche de temps (seconde)',
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'elapsedTimeSlowest', label: '> 10', color: '#848383' },
            { field: 'elapsedTimeSlow', label: '5 <> 10', color: '#8397A1' },
            { field: 'elapsedTimeMedium', label: '3 <> 5', color: '#83ACBF' },
            { field: 'elapsedTimeFast', label: '1 <> 3', color: '#82C0DC' },
            { field: 'elapsedTimeFastest', label: '< 1', color: '#81D4FA' }
        ],
        options: {
            chart: {
                height: 250,
                type: 'bar',
                stacked: true
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                followCursor: true
            },
            plotOptions: {
                bar: {
                    horizontal: false
                }
            },
            legend: {
                position: 'right',
                offsetY: 40
            }
        }
    };

    static readonly REPARTITION_TYPE_RESPONSE_BAR: ChartConfig = {
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'countSucces', label: '2xx', color: '#33cc33' },
            { field: 'countErrorClient', label: '4xx', color: '#ffa31a' },
            { field: 'countErrorServer', label: '5xx', color: '#ff0000' }
        ], // Inversion des stacks et group (Pivot), Revoir l'histoire des groups
        options: {
            chart: {
                height: 250,
                type: 'bar',
                stacked: true
            },
            tooltip: {
                shared: true,
                intersect: false,
                followCursor: true
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false
                }
            },
            legend: {
                position: 'right',
                offsetY: 40
            }
        }
    }

    static readonly REPARTITION_MAX_BY_PERIOD_LINE: ChartConfig = {
        title: 'Temps de reponse moyen et maximum',
        ytitle: 'Temps (s)',
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'max', color: "#FF0000", label: 'Temps max' }
        ],
        options: {
            chart: {
                height: 200,
                id: 'c',
                group: 'A',
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: [4]
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    datetimeUTC: false
                }
            },
            yaxis: {
                decimalsInFloat: 0
            },
            legend: {
                showForSingleSeries: true
            }
        }
    };

    static readonly REPARTITION_AVG_BY_PERIOD_LINE: ChartConfig = {
        ytitle: 'Temps (s)',
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'avg', color: "#FF9B00", label: 'Temps moyen' }
        ],
        options: {
            chart: {
                height: 200,
                id: 'b',
                group: 'A',
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: [4]
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    datetimeUTC: false
                }
            },
            yaxis: {
                decimalsInFloat: 3
            }, 
            legend: {
                showForSingleSeries: true
            }
        }
    };

    static readonly REPARTITION_REQUEST_BY_PERIOD_LINE: ChartConfig = {
        title: 'Nombre d\'appels',
        subtitle: 'sur les 7 derniers jours',
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'count', label: 'Nombre d\'appels', color: "#1423dc" }
        ],
        options: {
            chart: {
                type: 'area',
                id: 'sparkline-1',
                group: 'sparkline',
                height: 150,
                sparkline: {
                    enabled: true
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly REPARTITION_REQUEST_ERROR_BY_PERIOD_LINE: ChartConfig = {
        title: 'Nombre d\'appels en erreur',
        subtitle: 'sur les 7 derniers jours',
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'countErrorServer', label: 'Nombre d\'appels en erreur', color: "#ff0000" }
        ],
        options: {
            chart: {
                type: 'area',
                id: 'sparkline-2',
                group: 'sparkline',
                height: 150,
                sparkline: {
                    enabled: true
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                  formatter: function (val: any) {
                    return val.toFixed(0);
                  },
                }
              },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly REPARTITION_REQUEST_SLOWEST_BY_PERIOD_LINE: ChartConfig = {
        title: 'Nombre d\'appels superieur à 10 secondes',
        subtitle: 'sur les 7 derniers jours',
        category: {
            type: 'date',
            mapper: 'date'
        },
        mappers: [
            { field: 'countSlowest', label: 'Nombre d\'appels superieur à 10 secondes', color: "#848383" }
        ],
        options: {
            chart: {
                type: 'area',
                id: 'sparkline-3',
                group: 'sparkline',
                height: 150,
                sparkline: {
                    enabled: true
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            yaxis: {
                labels: {
                  formatter: function (val: any) {
                    return val.toFixed(0);
                  },
                }
              },
            subtitle: {
                offsetY: 20
            }
        }
    };
}

