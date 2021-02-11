/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
//import { useTheme } from '@material-ui/core/styles';
//import SalesReports from "./components/showReport";
import { Grid, Paper } from '@material-ui/core';
import './App.css';
import ReportComponent from './components/ReportComponent';
//import MobileReportComponent from './components/MobileReportComponent';
import ListReports from './components/ListReports';
import Typography from '@material-ui/core/Typography';

import Hidden from '@material-ui/core/Hidden';
interface Report {
    reportId: string;
    reportName: string;
}

const App = (): React.ReactElement => {
    const [reports, setReports] = useState<Report[]>();
    const [reportActive, setReportActive] = useState<Report>();

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
    return (
        <div>
            {reports?.length && (
                <Grid
                    container
                    direction="row"
                    justify="flex-start"
                    alignItems="flex-start"
                    style={{
                        backgroundColor: '#F0F8FF',
                    }}
                >
                    <Hidden xsDown>
                        <Grid item xs={2}>
                            <Paper style={{ width: '100%' }}>
                                <ListReports reports={reports} setReport={setReport} />
                            </Paper>
                        </Grid>
                    </Hidden>
                    {reportActive && (
                        <Grid item container xs={10} justify="center" alignItems="center" direction="column">
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    {reportActive?.reportName}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} style={{ width: '100%' }}>
                                <ReportComponent reportId={reportActive.reportId} />
                            </Grid>
                        </Grid>
                    )}
                    {/* <Hidden xsUp>
                        <Grid item container xs={12} justify="center" alignItems="center">
                            <Grid item xs={12} style={{ width: '100%' }}>
                                <MobileReportComponent reportId={'736dadd3-e55c-4680-a330-7b3feaa7a233'} />
                            </Grid>
                        </Grid>
                    </Hidden> */}
                </Grid>
            )}
        </div>
    );
};

export default App;
