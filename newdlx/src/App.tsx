/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
//import { useTheme } from '@material-ui/core/styles';
//import SalesReports from "./components/showReport";
//import { Grid } from '@material-ui/core';
import './App.css';
//import ReportComponent from './components/ReportComponent';
//import MobileReportComponent from './components/MobileReportComponent';
import ResponsiveDrawer from './components/ResponseDrawer';
//import Typography from '@material-ui/core/Typography';
import ReportBiClientComponent from './components/ReportBiClientComponent';
import { withAITracking } from '@microsoft/applicationinsights-react-js';
import { reactPlugin, appInsights } from './Azure/AppInsights';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { Button, Grid } from '@material-ui/core';
//import Hidden from '@material-ui/core/Hidden';
interface Report {
    reportId: string;
    reportName: string;
}

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
        },
        drawer: {
            [theme.breakpoints.up('sm')]: {
                width: drawerWidth,
                flexShrink: 0,
            },
        },
        appBar: {
            [theme.breakpoints.up('sm')]: {
                width: `calc(100% - ${drawerWidth}px)`,
                marginLeft: drawerWidth,
            },
        },
        menuButton: {
            marginRight: theme.spacing(2),
            [theme.breakpoints.up('sm')]: {
                display: 'none',
            },
        },
        // necessary for content to be below app bar
        toolbar: theme.mixins.toolbar,
        drawerPaper: {
            width: drawerWidth,
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(3),
        },
    }),
);

const App = (): React.ReactElement => {
    const [reports, setReports] = useState<Report[]>();
    const [reportActive, setReportActive] = useState<Report>();
    const [editMode, setEditMode] = useState<boolean>(false);

    const classes = useStyles();

    const getReports = async () =>
        axios
            .get<Report[]>('http://localhost:5300/getReportsByGroup')
            .then((resp): void => {
                setReports(resp.data);
            })
            .catch((err) => console.log(err));
    useEffect(() => {
        getReports();
    }, []);
    // useEffect(() => {
    //     // console.log(reports);
    //     console.log(props.width);
    // }, [props.width]);
    const setReport = (reportId: string) => {
        const reportActive = reports?.find((el) => el.reportId === reportId);
        setReportActive(reportActive);
    };
    const handleEdimodeChange = () => {
        setEditMode(!editMode);
    };
    return (
        <div className={classes.root}>
            {reports?.length && (
                <>
                    <ResponsiveDrawer reports={reports} setReport={setReport} reportName={reportActive?.reportName} />
                    {reportActive && (
                        <main className={classes.content}>
                            <div className={classes.toolbar} />
                            <Grid container alignItems="center" justify="center">
                                {editMode && (
                                    <Grid item>
                                        <span style={{ fontSize: 16, paddingRight: 20 }}>!!!Edit Mode!!!</span>
                                    </Grid>
                                )}
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        component="span"
                                        onClick={handleEdimodeChange}
                                    >
                                        Edit Mode
                                    </Button>
                                </Grid>
                            </Grid>
                            {/* <ReportComponent reportId={reportActive.reportId} /> */}
                            <ReportBiClientComponent
                                reportId={reportActive.reportId}
                                appInsights={appInsights}
                                editMode={editMode}
                            />
                        </main>
                    )}
                </>
            )}
        </div>
    );
};

export default withAITracking(reactPlugin, App);
