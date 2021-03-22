/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect } from 'react';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ReportEmbedding from '../PowerBi/ReportEmbeddingClass';
import * as pbi from 'powerbi-client';

export interface IReportProps {
    reportId: string;
    appInsights: any;
    editMode: boolean;
}

export interface VisualInterface {
    height: number;
    width: number;
    x: number;
    y: number;
    z: number;
    title: string;
    page: number;
}

function ReportBiClientComponent(props: IReportProps) {
    const [report, setReport] = React.useState<pbi.Report | null>(null);
    const [visuals, setVisuals] = React.useState<[VisualInterface] | null>(null);
    const reportContainer = React.createRef<HTMLDivElement>();
    const setReportData = (report: any) => {
        console.log(report);
        setReport(report);
    };
    const reportEmbedding = new ReportEmbedding(props.appInsights, setVisuals, setReportData);
    const useStyles = makeStyles(() => ({
        container: {
            height: isMobileViewport ? 'calc(100vh - 140px)' : '100%',
        },
    }));

    const theme = useTheme();
    const isMobileViewport = useMediaQuery(theme.breakpoints.down('xs'), {
        noSsr: true,
    });

    const classes = useStyles();

    const embeding = (
        reportId: string,
        reportContainer: HTMLDivElement,
        isMobileViewport: boolean,
        editMode: boolean,
        visuals: [VisualInterface] | null,
    ): void => {
        reportEmbedding.resetElem(reportContainer);
        reportEmbedding.embedReport(reportId, reportContainer, isMobileViewport, editMode, visuals);
    };

    useEffect(() => {
        reportContainer &&
            reportContainer.current &&
            embeding(props.reportId, reportContainer.current, isMobileViewport, false, null);
    }, [props.reportId]);

    useEffect(() => {
        if (!props.editMode) {
            reportEmbedding.getVisuals(report).then((res: any) => {
                console.log(res);
                setVisuals(res);
                reportContainer &&
                    reportContainer.current &&
                    embeding(props.reportId, reportContainer.current, isMobileViewport, props.editMode, res);
            });
        } else {
            reportContainer &&
                reportContainer.current &&
                embeding(props.reportId, reportContainer.current, isMobileViewport, props.editMode, visuals);
        }
        //console.log(report);
    }, [props.editMode]);

    return <div ref={reportContainer} className={classes.container} />;
}
export default ReportBiClientComponent;
