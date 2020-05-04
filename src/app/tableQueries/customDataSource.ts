// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
import { ApiService } from '../services/api/api.service';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, of, pipe } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

export class CustomDataSource implements DataSource<any[]> {
    // --------------------------- //
    // Local variables declaration //
    // --------------------------- //
    private months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    private dataSubject = new BehaviorSubject<any[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    // Observers declaration (avoid leaks and uses for communicate through components) //
    public loading$ = this.loadingSubject.asObservable();
    // --------------------- //
    // Component constructor //
    // --------------------- //
    constructor(
        private apiService: ApiService
    ) {}
    // ------------------------------------------------//
    // Method to make a connection with the DataSource //
    // ------------------------------------------------//
    connect(collectionViewer: CollectionViewer): Observable<any[]> {
        return this.dataSubject.asObservable();
    }
    // ----------------------------------------------------------------//
    // Method to disconnect the DataSource (once finished the process) //
    // ----------------------------------------------------------------//
    disconnect(collectionViewer: CollectionViewer): void {
        this.dataSubject.complete();
        this.loadingSubject.complete();
    }
    // ------------------------------------//
    // Method to load data using the query //
    // ------------------------------------//
    loadData(query: string): Observable<any[]> {
        this.loadingSubject.next(true);
        return new Observable(objs => {
            this.apiService.getTableDataObjects(query).pipe(
                catchError(() => of([])),
                finalize(() => {
                    this.loadingSubject.next(false);
                })
            ).subscribe((data: any[]) => {
                // ---------------- //
                // Pre process data //
                // ---------------- //
                if (query.indexOf('Notes?') >= 0) {
                    data.forEach((note, index) => {
                        note.formattedDate = this.getFormattedDate(note.createdAt);
                        note.formattedReminderDate = this.getFormattedDate(note.reminderDate);
                        note.formattedReminderTime = this.getFormattedTime(note.reminderDate);
                    });
                } else if (query.indexOf('Deals?') >= 0) {
                    data.forEach((deal, index) => {
                        deal.formattedDate = this.getFormattedDate(deal.createdAt);
                        deal.formattedTime = this.getFormattedTime(deal.createdAt);
                        deal.shipmentRatio = this.getShipmentRatio(deal.shipmentFrom, deal.shipmentTo);
                    });
                } else if (query.indexOf('Clients?') >= 0) {
                    data.forEach((client, index) => {
                        client.index = index;
                    });
                } else if (query.indexOf('Groups?') >= 0) {
                    data.forEach((group, index) => {
                        group.clients ? group.clientsCount = group.clients.length : group.clientsCount = 0;
                        group.filtersCount = 0;
                    });
                } else if (query.indexOf('Reminders?') >= 0) {
                    data.forEach((reminder, index) => {
                        reminder.formattedDate = this.getFormattedDate(reminder.date);
                        reminder.formattedTime = this.getFormattedTime(reminder.date);
                    });
                }
                // ---------------------------------------------------------//
                // Once the data processing finished, notify the dataSuject //
                // ---------------------------------------------------------//
                this.dataSubject.next(data);
                objs.next(data);
            });
        });
    }
    getFormattedDate(date) {
        const tempDate = new Date(date);
        const month = (tempDate.getMonth() + 1);
        const day = tempDate.getDate();
        const year = tempDate.getFullYear();
        return month + '/' + day + '/' + year;
    }
    getFormattedTime(date) {
        const tempDate = new Date(date);
        let hours: any = tempDate.getHours();
        hours < 10 ? (hours = '0' + hours.toString()) : hours.toString();
        let minutes: any = tempDate.getMinutes();
        minutes < 10 ? (minutes = '0' + minutes.toString()) : minutes.toString();
        return hours + ':' + minutes;
    }
    getShipmentRatio(from, to) {
        const fromDate = new Date(from);
        const fromMonth = this.months[fromDate.getMonth()];
        const fromYear = fromDate.getFullYear();
        const toDate = new Date(to);
        const toMonth = this.months[toDate.getMonth()];
        const toYear = toDate.getFullYear();
        return fromMonth + '/' + fromYear + ' - ' + toMonth + '/' + toYear;
    }
}
