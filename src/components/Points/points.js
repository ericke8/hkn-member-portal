import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { withFirebase } from '../Firebase'
import { compose } from 'recompose'
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';

import { USER_ROLES } from '../../constants/roles'
import { POINT_TYPE } from '../../constants/pointtype'

const styles = theme => ({
  root: {
    width: "100%",
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  contentWrapper: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: theme.spacing.unit * 9,

    alignItems: 'center',
    height: "100vh",
  },
  card: {
    minWidth: 275,
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
})

const months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

class PointsPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userRole: "",
      mentorship: false,
      professional: false,
      inducteePoints: [],
      inducteeMentorPoints: [],
      memberPoints: [],
      memberMentorPoints: [],
      totalPoints: {
        induction: 0,
        member: 0,
      },
      pointRewardTypes: {},
      roles: {},
    };
  }

  componentDidMount() {
    this.props.firebase.getEnumMap('pointRewardType')
      .then((pointEnum) => { this.setState({ pointRewardTypes: pointEnum }) })
    this.props.firebase.getEnumMap('roles')
      .then((roleEnum) => { this.setState({ roles: roleEnum }) })
    this.props.firebase.getUserDocument()
      .then(docSnapshot => {
        if (!docSnapshot.exists) {
          throw Error('User document does not exist.')
        }
        return docSnapshot.data()
      })
      .then(data => {
        this.setState({
          userRole: data.role_id,
          mentorship: data.mentorship,
          professional: data.professional
        })
      })

    this.props.firebase.getPoints()
      .then(query => {
        if (!query) {
          throw Error('Point query failed')
        }
        const pointsList = {
          inducteePointsList: [],
          inducteeMentorList: [],
          memberPointsList: [],
          memberMentorList: [],
          totals: {
            induction: 0,
            member: 0,
          }
        }
        query.docs.forEach(doc => {
          const data = doc.data();
          if (data.pointrewardtype_id === this.state.pointRewardTypes[POINT_TYPE.INDUCTION]) {
            if (data.event_name.includes("Mentor")) {
              pointsList.inducteeMentorList.push({
                event_name: data.event_name,
                date: new Date(data.created.seconds * 1000),
                value: data.value,
                officer: data.officer_name,
              })
            } else {
              pointsList.inducteePointsList.push({
                event_name: data.event_name,
                date: new Date(data.created.seconds * 1000),
                value: data.value,
                officer: data.officer_name,
              })
            }
            pointsList.totals.induction++
          } else {
            if (data.event_name.includes("Mentor")) {
              pointsList.memberMentorList.push({
                event_name: data.event_name,
                date: new Date(data.created.seconds * 1000),
                value: data.value,
                officer: data.officer_name,
              })
            } else {
              pointsList.memberPointsList.push({
                event_name: data.event_name,
                date: new Date(data.created.seconds * 1000),
                value: data.value,
                officer: data.officer_name,
              })
            }
            pointsList.totals.member++
          }
        })
        return pointsList
      })
      .then(pointsList => {
        this.setState({
          inducteePoints: pointsList.inducteePointsList,
          inducteeMentorPoints: pointsList.inducteeMentorList,
          memberPoints: pointsList.memberPointsList,
          memberMentorPoints: pointsList.memberMentorList,
          totalPoints: pointsList.totals,
        })
      })
  }


  render() {
    return (
      <div className={this.props.classes.root}>
        <div className={this.props.classes.contentWrapper}>
          {this.state.userRole === this.state.roles[USER_ROLES.MEMBER] || this.state.userRole === this.state.roles[USER_ROLES.OFFICER] ?
            <div>
              <h2>Member Points</h2>
              <Grid container spacing={24}>
                <Grid item><h3>Total Member Points: {this.state.totalPoints.member}</h3></Grid>
              </Grid>

              {this.state.memberPoints.length > 0 ?
                <Grid container spacing={16}>
                  {this.state.memberPoints.map((event, key) => {
                    return <Grid item xs={3} key={key}>
                      <Card className={this.props.classes.card}>
                        <CardContent>
                          <Typography variant="h5" component="h2">
                            {event.event_name}
                          </Typography>
                          <Typography className={this.props.classes.pos} color="textSecondary">
                            {`${months_arr[event.date.getMonth()]} ${event.date.getDate()}, ${event.date.getFullYear()}`}
                          </Typography>
                          <Typography variant="body2" component="p">
                            {`Officer: ${event.officer}`}
                            <br />
                            {`Points: ${event.value}`}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  })}
                </Grid> : <div>None</div>}

              <h3>Mentor Points</h3>
              {this.state.memberMentorPoints.length > 0 ?
                <Grid container spacing={16}>
                  {this.state.memberMentorPoints.map((event, key) => {
                    return <Card className={this.props.classes.card}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                          {event.event_name}
                        </Typography>
                        <Typography className={this.props.classes.pos} color="textSecondary">
                          {`${months_arr[event.date.getMonth()]} ${event.date.getDate()}, ${event.date.getFullYear()}`}
                        </Typography>
                        <Typography variant="body2" component="p">
                          {`Officer: ${event.officer}`}
                          <br />
                          {`Points: ${event.value}`}
                        </Typography>
                      </CardContent>
                    </Card>
                  })}
                </Grid> : <div>None</div>}
              <br />
              <Divider />
            </div> : null}

          <h2>Inductee Points</h2>
          <Grid container spacing={24}>
            <Grid item><h3>Total Inductee Points: {this.state.totalPoints.induction}</h3></Grid>
            <Grid item><h3>Mentor Point: {this.state.mentorship ? `Complete` : `Incomplete`}</h3></Grid>
            <Grid item><h3>Professional Requirement: {this.state.professional ? `Complete` : `Incomplete`}</h3></Grid>
          </Grid>
          {this.state.inducteePoints.length > 0 ?
            <Grid container spacing={16}>
              {this.state.inducteePoints.map((event, key) => {
                return (
                  <Grid item xs={3} key={key}>
                    <Card className={this.props.classes.card}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                          {event.event_name}
                        </Typography>
                        <Typography className={this.props.classes.pos} color="textSecondary">
                          {`${months_arr[event.date.getMonth()]} ${event.date.getDate()}, ${event.date.getFullYear()}`}
                        </Typography>
                        <Typography variant="body2" component="p">
                          {`Officer: ${event.officer}`}
                          <br />
                          {`Points: ${event.value}`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid> : <div>None</div>}

          <h3>Mentor Points</h3>
          {this.state.inducteeMentorPoints.length > 0 ?
            <Grid container spacing={16}>
              {this.state.inducteeMentorPoints.map((event, key) => {
                return (
                  <Grid item xs={3} key={key}>
                    <Card className={this.props.classes.card}>
                      <CardContent>
                        <Typography variant="h5" component="h2">
                          {event.event_name}
                        </Typography>
                        <Typography className={this.props.classes.pos} color="textSecondary">
                          {`${months_arr[event.date.getMonth()]} ${event.date.getDate()}, ${event.date.getFullYear()}`}
                        </Typography>
                        <Typography variant="body2" component="p">
                          {`Officer: ${event.officer}`}
                          <br />
                          {`Points: ${event.value}`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid> : <div>None</div>}
        </div>
      </div>
    );
  }
}

export default compose(withStyles(styles), withFirebase)(PointsPage)