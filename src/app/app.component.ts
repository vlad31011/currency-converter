import {Component} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operator/map';
import {debounceTime} from 'rxjs/operator/debounceTime';
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public date_model: any = new Date();
  public currency_input_type: any;
  public currency_output_type: any;
  public number_currency: number;
  private currencies: any;
  private currencies_input: any;
  private currencies_output: any;
  public answer: number;
  public resolve: any;


  formatter = (result: any) => result.Cur_Abbreviation.toUpperCase();

  search = (text$: Observable<string>) =>
    map.call(distinctUntilChanged.call(debounceTime.call(text$, 200)),
      term => {
        return term.length < 2 ? [] : this.currencies.filter(v => v.Cur_Abbreviation.toLowerCase().indexOf(term.toLowerCase()) > -1 &&
          (this.parseDPModel(this.date_model) >= v.Cur_DateStart.substring(0, 10)) &&
          (this.parseDPModel(this.date_model) < v.Cur_DateEnd.substring(0, 10))).slice(0, 10);
      })

  public parseDPModel = (dpModel) => {
    let dd = dpModel.day;
    let mm = dpModel.month;
    if (mm < 10) {
      mm = '0' + mm;
    }
    if (dd < 10) {
      dd = '0' + dd;
    }
    return dpModel.year + '-' + mm + '-' + dd;
  }

  constructor(private http: HttpClient) {
    let curDate = new Date();
    this.date_model = {'year': curDate.getFullYear(), 'month': curDate.getMonth(), 'day': curDate.getDate()};

    http.get('http://www.nbrb.by/API/ExRates/Currencies')
      .subscribe((data) => {
        this.currencies = data;
        console.log(this.currencies);

      });
  }

  public getCurrencies() {
    this.http.get(`http://www.nbrb.by/API/ExRates/Rates/${(this.currency_input_type.Cur_ID)}?onDate=${this.parseDPModel(this.date_model)}`)
      .subscribe((data) => {
        this.currencies_input = data;
        if (this.currency_output_type === 'BLR') {
          this.answer = this.currencies_input.Cur_OfficialRate * this.number_currency;
          this.resolve = (Math.round(this.answer * 100) / 100);
        } else {
          this.http.get(`http://www.nbrb.by/API/ExRates/Rates/${(this.currency_output_type.Cur_ID)}?onDate=${this.parseDPModel(this.date_model)}`)
            .subscribe((res) => {
              this.currencies_output = res;
              console.log(this.currencies_output);
              console.log(this.currency_output_type);

              this.answer = this.currencies_input.Cur_OfficialRate * this.number_currency / this.currencies_output.Cur_OfficialRate;
              this.resolve = (Math.round(this.answer * 100) / 100);
            });
        }
      });
  }
}
