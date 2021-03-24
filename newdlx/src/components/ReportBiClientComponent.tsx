/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect } from 'react';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Grid from '@material-ui/core/Grid';
import ReportEmbedding from '../PowerBi/ReportEmbeddingClass';
import * as pbi from 'powerbi-client';
import axios from 'axios';
import VisibleFilter from './VisibleFilter';

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
    visible: boolean;
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
                console.log(resp.data);
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
                const visualsVis = res.map((el: any) => {
                    const visual = visuals?.find((item) => item.title === el.title);
                    return {
                        ...el,
                        visible: visual?.visible,
                    };
                });
                setVisualsData(visualsVis);
                container &&
                    container.current &&
                    embeding(props.reportId, container.current, isMobileViewport, props.editMode, visualsVis);
            });
        } else {
            reportContainer &&
                reportContainer.current &&
                embeding(props.reportId, reportContainer.current, isMobileViewport, props.editMode, visuals);
        }
        //console.log(report);
    }, [props.editMode]);
    const handleChecked = (value: string) => {
        const newVis =
            visuals &&
            (visuals.map((el) => ({
                ...el,
                visible: el.title === value ? !el.visible : el.visible,
            })) as [VisualInterface] | null);

        setVisualsData(newVis);
        reportContainer &&
            reportContainer.current &&
            embeding(props.reportId, reportContainer.current, isMobileViewport, props.editMode, newVis);
    };
    return (
        <Grid container alignItems="flex-start" justify="center">
            <Grid item xs={10}>
                <div ref={reportContainer} className={classes.container} />
            </Grid>
            {visuals && (
                <Grid item xs={2}>
                    <VisibleFilter visuals={visuals} handleChecked={handleChecked} />
                </Grid>
            )}
        </Grid>
    );
}
export default ReportBiClientComponent;
