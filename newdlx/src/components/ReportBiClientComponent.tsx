/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect } from 'react';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ReportEmbedding from '../PowerBi/ReportEmbeddingClass';
import * as pbi from 'powerbi-client';
import axios from 'axios';

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

export interface ToSendVisuals {
    info: VisualInterface;
    report: string;
}

function ReportBiClientComponent(props: IReportProps) {
    const [report, setReport] = React.useState<pbi.Report | null>(null);
    const [visuals, setVisuals] = React.useState<[VisualInterface] | null>(null);
    const reportContainer = React.createRef<HTMLDivElement>();
    const setReportData = (report: any) => {
        setReport(report);
    };
    const reportEmbedding = new ReportEmbedding(props.appInsights, setReportData);
    const useStyles = makeStyles(() => ({
        container: {
            height: isMobileViewport ? 'calc(100vh - 140px)' : '100%',
        },
    }));
    const getVisualsApi = async () =>
        axios
            .get<any>(`http://localhost:5300/getReportInfo/${props.reportId}`)
            .then((resp): any => {
                setVisuals(resp.data);
                return resp.data;
            })
            .catch((err) => console.log(err));
    const setVisualsApi = async (resVisuals: any) =>
        axios
            .post<any>('http://localhost:5300/setReportInfo', {
                info: resVisuals,
                report: props.reportId,
            })
            .then((resp): void => {
                console.log(resp);
            })
            .catch((err) => console.log(err));
    const setVisualsData = (res: any) => {
        setVisuals(res);
        setVisualsApi(res);
    };
    const theme = useTheme();
    const isMobileViewport = useMediaQuery(theme.breakpoints.down('xs'), {
        noSsr: true,
    });
    useEffect(() => {
        getVisualsApi();
    }, []);
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
        const container = Object.assign({}, reportContainer);
        getVisualsApi().then((visualsData) => {
            container &&
                container.current &&
                embeding(
                    props.reportId,
                    container.current,
                    isMobileViewport,
                    false,
                    visualsData ? visualsData : visuals,
                );
        });
    }, [props.reportId]);

    useEffect(() => {
        if (!props.editMode) {
            const container = Object.assign({}, reportContainer);
            reportEmbedding.getVisuals(report).then((res: any) => {
                setVisualsData(res);
                container &&
                    container.current &&
                    embeding(props.reportId, container.current, isMobileViewport, props.editMode, res);
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
