export class Utils {

    reIcon: any = {
        
    }
    dbactionIcon: any =
        {
            'CONNECTION': '#1423DC',
            'METADATA'  : '#2134CB',
            'STATEMENT' : '#2E45BA',
            'EXECUTE'   : '#3B56A9',
            'RESULTSET' : "#486798",
            'SELECT'    : '#557887',
            'UPDATE'    : '#628976',
            'BATCH'     : '#6F9A65',
            'COMMIT'    : '#7CAB54',
            'ROLLBACK'  : '#89BC43',
            'FETCH'     : '#96CD32',
            ' '         : '#e9ecef'
        };
    protocol: any = {
        'http': 'fa-solid fa-lock-open',
        'https': 'fa-solid fa-lock'
    }
    os: any = {
        'Windows 10.0': 'fa-brands fa-windows',
        'Windows 10': 'fa-brands fa-windows',
        'Linux': 'fa-brands fa-linux fa-xl',
    }
    re: any = {
        'firefox': 'fa-brands fa-firefox-browser fa-xl',
        'chrome': 'fa-brands fa-chrome fa-xl',
        'java': 'fa-brands fa-java fa-xl',
    }

    getStateColor(status: number) { // put it in util class 

        if (status >= 200 && status < 300)
            return "green"

        if (status >= 300 && status < 500)
            return "orange"

        if (status >= 500)
            return 'red';
        return "gray"
    }

    getStateColorBool(failed: boolean) {
        if (failed)
            return 'red'
        return 'green';
    }

    statusBorder(param: any): { [key: string]: string } {
        if (typeof param == "boolean") {
            return { 'box-shadow': '4px 0px 0px 0px ' + this.getStateColorBool(param) + ' inset' };
        }
        return { 'box-shadow': '4px 0px 0px 0px ' + this.getStateColor(param) + ' inset' };
    }

    statusBorderCard(param: any): { [key: string]: string } {
        if (typeof param == "boolean") {
            return { 'border-left': '4px solid ' + this.getStateColorBool(param) };
        }
        return { 'border-left': '4px solid ' + this.getStateColor(param) };
    }

    convertSeconds = (seconds: number): string => {
        const hours = Math.round(Math.floor(seconds / 3600))
        const minutes = Math.round(Math.floor((seconds % 3600) / 60))
        const remainingSeconds = Math.round(seconds % 60)

        const hourString = hours > 0 ? `${hours}h` : ''
        const minuteString = minutes > 0 ? `${minutes}min` : ''
        const secondString = `${remainingSeconds}s` 

        if (hours > 0) {
            return `${hourString}, ${minuteString || '0 min'} ${secondString && `: ${secondString}`}`
        } else if (!hours && minutes > 0) {
            return `${minuteString} ${secondString && `: ${secondString}`}`
        }

        return secondString
    }

    public getRe(re: string) {

        let result = re
        if (re) {
            Object.keys(this.re).forEach(element => {
                const startIndex = re.indexOf(element);
                if (startIndex != -1) {
                    const endIndex = startIndex + element.length;
                    const icon = re.substring(startIndex, endIndex);
                    result = '<i class="' + this.re[icon] + '"></i> ' + re
                }
            });
        }
        return result;
    }

    public getSessionUrl(selectedSession: any) {
        return `${selectedSession?.protocol?selectedSession?.protocol+'://':''}${selectedSession?.host?selectedSession?.host:''}${selectedSession?.port > 0 ? ':' + selectedSession?.port : ''}${selectedSession?.path?selectedSession?.path:''}${selectedSession?.query ? '?' + selectedSession?.query : ''}`
    }

    public getElapsedTime(end: number, start: number,) {
        return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
    }

}

export function groupingBy(arr: any[], field: string): any {
    return arr.reduce((acc, o) => {
      var key = o[field];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(o);
      return acc;
    }, {})
  }

