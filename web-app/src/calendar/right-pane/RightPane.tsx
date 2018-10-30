import { AppointmentModel } from 'appointments/AppointmentModel';
import { ClientModel } from 'clients/ClientModel';
import { IClient } from 'clients/IClient';
import { Button } from 'components/Button';
import { ButtonLink } from 'components/ButtonLink';
import { TextField } from 'components/TextField';
import { TypeaheadField } from 'components/TypeaheadField';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { RootStore } from 'RootStore';
import { normalizeDate, normalizeTime } from 'utils/dateTimeUtils';
import CalendarIcon from './calendar-alt-regular.svg';
import ClockIcon from './clock-regular.svg';
import './RightPane.css';

interface IProps {
  rootStore?: RootStore;
}

interface IState {
  form: Pick<IClient, keyof IClient> & { date: string; time: string };
  client?: ClientModel;
  appointment?: AppointmentModel;
}

@inject('rootStore')
@observer
export class RightPane extends React.Component<IProps, IState> {
  public readonly state: IState = {
    form: {
      fullName: '',
      phoneNumber: '',
      email: '',
      date: '',
      time: ''
    }
  };

  public render() {
    const {
      form: { fullName, phoneNumber, email, date, time },
      client
    } = this.state;
    const { clientStore } = this.getRootStore();
    return (
      <aside className="app__right-pane">
        <div className="grid-col-2">
          <h2 className="app__right-pane__h">
            {client ? 'Client' : 'New Client'}
          </h2>
          <ButtonLink
            className="h__btn-link app__right-pane__h"
            onClick={this.handleOnNewClientClick}
            disabled={!client}
          >
            new client
          </ButtonLink>
        </div>
        <TypeaheadField
          title="Full Name"
          name="fullName"
          value={fullName}
          items={clientStore.clients}
          onChange={this.handleOnChange}
          onSelected={this.handleOnSelected}
          onBlur={this.handleClientOnBlur}
        />
        <TextField
          title="Email"
          name="email"
          value={email}
          onChange={this.handleOnChange}
          onBlur={this.handleClientOnBlur}
        />
        <TextField
          title="Phone Number"
          name="phoneNumber"
          value={phoneNumber}
          onChange={this.handleOnChange}
          onBlur={this.handleClientOnBlur}
        />
        <h2>Appointment</h2>
        <div className="grid-col-2">
          <TextField
            name="date"
            title="Date"
            value={date}
            suffix={<CalendarIcon className="appointment__calendar-icon" />}
            onChange={this.handleOnChange}
            onBlur={this.handleOnDateBlur}
          />
          <TextField
            name="time"
            title="Time"
            value={time}
            suffix={<ClockIcon className="appointment__calendar-icon" />}
            onChange={this.handleOnChange}
            onBlur={this.handleOnTimeBlur}
          />
        </div>
        <TextField title="Services" />
        <div className="pane__bottom">
          <Button className="btn--secondary">Cancel Appointment</Button>
        </div>
      </aside>
    );
  }

  private handleOnNewClientClick = () => {
    this.setState({
      client: undefined,
      form: {
        fullName: '',
        email: '',
        phoneNumber: '',
        date: '',
        time: ''
      }
    });
  };

  private handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.name) {
      this.updateForm(event.target.name, event.target.value);
    }
  };

  private handleOnSelected = (client: ClientModel) => {
    this.setState({
      form: {
        ...this.state.form,
        fullName: client.fullName,
        email: client.email,
        phoneNumber: client.phoneNumber
      },
      client
    });
  };

  private handleClientOnBlur = () => {
    const { form, client } = this.state;
    if (client && client.equals(form)) {
      client.update(form);
    } else {
      const { fullName, email, phoneNumber } = form;
      if (fullName) {
        const { clientStore } = this.getRootStore();
        let newClient: ClientModel;
        if (clientStore.exists(form)) {
          newClient = clientStore.getByFullName(form.fullName);
          newClient.update(form);
        } else {
          // TODO: move client initialization into create function
          newClient = new ClientModel(fullName, phoneNumber, email);
          clientStore.create(newClient);
        }
        this.setState({
          client: newClient
        });
      }
    }
  };

  private handleOnDateBlur = () => {
    const baseDate = new Date();
    const { form } = this.state;
    if (form.date) {
      this.updateForm(
        'date',
        normalizeDate(form.date, baseDate),
        this.handleAppointmentOnBlur
      );
    }
  };

  private handleOnTimeBlur = () => {
    const { form } = this.state;
    if (form.time) {
      this.updateForm(
        'time',
        normalizeTime(form.time),
        this.handleAppointmentOnBlur
      );
    }
  };

  private updateForm = (name: string, value: string, callback?: () => void) => {
    this.setState(
      {
        ...this.state,
        form: {
          ...this.state.form,
          [name]: value
        }
      } as Pick<IState, keyof IState>,
      callback
    );
  };

  private handleAppointmentOnBlur = () => {
    const { form, appointment } = this.state;
    if (form.date && form.time) {
      // TODO: validate date time formats
      if (appointment) {
        appointment.update(this.formToAppointment());
      } else {
        const { appointmentsModel } = this.getRootStore();
        const newAppointment = appointmentsModel.create(
          this.formToAppointment()
        );
        this.setState({
          appointment: newAppointment
        });
      }
    }
  };

  private formToAppointment = () => {
    const { form, client } = this.state;
    return {
      date: form.date,
      time: form.time,
      clientId: client && client.id
    };
  };

  private getRootStore = () => {
    return this.props.rootStore!;
  };
}
