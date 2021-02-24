/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect } from 'react';
import { useTheme, makeStyles, Theme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ReportEmbedding from '../PowerBi/ReportEmbeddingClass';
import ReportFilters from './ReportFilters';
import { IFilterConfiguration } from '../PowerBi/FilterBuilder';
import * as pbi from 'powerbi-client';

export interface IReportProps {
    reportId: string;
    filterConfiguration2: IFilterConfiguration;
    theme: Theme;
}

function ReportBiClientComponent(props: IReportProps) {
    const reportContainer = React.createRef<HTMLDivElement>();
    const reportEmbedding = new ReportEmbedding();

    const useStyles = makeStyles(() => ({
        container: {
            height: isMobileViewport ? 'calc(100vh - 140px)' : '100%',
            visibility: 'hidden',
        },
        reportWrapper: {
            minHeight: '90vh',
            backgroundImage: 'url(/images/loading.gif)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '50% 50%',
            backgroundSize: '40px 8px',
        },
        button: {
            margin: theme.spacing(1),
        },
        reportOptionsContainer: {
            borderBottom: '1px solid #eaeaea',
            marginBottom: '10px',
            display: 'inline-block',
            width: '100%',
        },
    }));

    const theme = useTheme();
    const isMobileViewport = useMediaQuery(theme.breakpoints.down('xs'), {
        noSsr: true,
    });

    const classes = useStyles();

    const embeding = (reportId: string, reportContainer: HTMLDivElement, isMobileViewport: boolean): void => {
        reportEmbedding.resetElem(reportContainer);
        reportContainer.style.visibility = 'hidden';
        console.log(reportContainer);
        reportEmbedding.embedReport(reportId, reportContainer, isMobileViewport);
    };

    useEffect(() => {
        reportContainer?.current && embeding(props.reportId, reportContainer.current, isMobileViewport);
    }, [props.reportId]);
    // Report Filters
    function filterCallback(filters: Array<pbi.models.IFilter>): void {
        reportEmbedding.applyReportFilters(filters, reportContainer?.current);
    }
    const reportFilters = (
        <ReportFilters
            applyFilterCallback={filterCallback}
            filterConfiguration={props.filterConfiguration2}
            {...props}
        />
    );

    return (
        <div>
            <div className={classes.reportOptionsContainer}>{reportFilters}</div>
            <div id="reportWrapp" className={classes.reportWrapper}>
                <div id="container" ref={reportContainer} className={classes.container} />
            </div>
        </div>
    );
}
export default ReportBiClientComponent;
