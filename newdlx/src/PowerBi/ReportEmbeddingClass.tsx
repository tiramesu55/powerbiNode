/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as pbi from 'powerbi-client';
import { IEmbedConfiguration, IEmbedSettings } from 'powerbi-client';
import * as models from 'powerbi-models';
import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
interface IReportEmbedModel {
    id: string;
    embedUrl: string;
    accessToken: string;
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

const ColumnsNumber = {
    One: 1,
    Two: 2,
    Three: 3,
};

const LayoutShowcaseConsts = {
    margin: 15,
    minPageWidth: 270,
};

const LayoutShowcaseState = {
    columns: ColumnsNumber.Three,
    layoutVisuals: [],
    layoutReport: null,
    layoutPageName: '',
};

export default class ReportEmbedding {
    [x: string]: any;
    public report: pbi.Report | null;
    private pbiService: pbi.service.Service;
    private instAI: ApplicationInsights;
    constructor(appInsights: any, setReport: any) {
        this.pbiService = new pbi.service.Service(
            pbi.factories.hpmFactory,
            pbi.factories.wpmpFactory,
            pbi.factories.routerFactory,
        );
        this.instAI = appInsights;
        this.setReport = setReport;
        this.report = null;
    }

    public resetElem(hostContainer: HTMLDivElement): void {
        this.pbiService.reset(hostContainer);
    }
    // private setReport(report: pbi.Report): void {
    //     console.log(report);
    //     this.report = report;
    // }
    public embedReport(
        reportId: string,
        hostContainer: HTMLDivElement,
        showMobileLayout: boolean,
        editMode: boolean,
        visuals: [VisualInterface] | null,
    ): void {
        //this.instAI.trackEvent({ name: 'embed start', properties: { id: 'slava', time: new Date().getTime() } });
        //   this.instAI.trackException({ error: new Error('Error'), severityLevel: SeverityLevel.Error });
        const start = new Date().getTime();
        this.getReportEmbedModel(reportId)
            .then((apiResponse) => this.getReportEmbedModelFromResponse(apiResponse))
            .then((responseContent) => this.buildReportEmbedConfiguration(responseContent, showMobileLayout, editMode))
            .then((reportConfiguration) => {
                this.runEmbedding(reportConfiguration, hostContainer, reportId, showMobileLayout, visuals, editMode);

                this.instAI.trackEvent({
                    name: `embed report ${reportId}`,
                    properties: { reportTime: new Date().getTime() - start },
                });
                // this.instAI.trackTrace({ message: 'done', severityLevel: SeverityLevel.Information });
            })
            .catch((err) => {
                console.log(err);
                this.instAI.trackException({ error: new Error(err.toString()), severityLevel: SeverityLevel.Error });
            });
    }

    private getReportEmbedModel(reportId: string): Promise<Response> {
        const request = new Request(`http://localhost:5300/getReport/${reportId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'GET',
        });

        return fetch(request);
    }

    private getReportEmbedModelFromResponse(response: Response): Promise<any> {
        if (response.status === 200) {
            return response.json();
        } else throw 'Error fetching report embed model';
    }

    private buildReportEmbedConfiguration(
        embedModel: IReportEmbedModel,
        showMobileLayout: boolean,
        editMode: boolean,
    ): IEmbedConfiguration {
        const layoutSettings = {
            displayOption: models.DisplayOption.FitToWidth,
        } as models.ICustomLayout;

        const renderSettings = {
            //filterPaneEnabled: true,
            //    navContentPaneEnabled: false,
            layoutType: showMobileLayout ? models.LayoutType.MobilePortrait : models.LayoutType.Custom,
            customLayout: layoutSettings,
            bars: {
                //top bar save...
                actionBar: {
                    visible: false,
                },
            },
            background: models.BackgroundType.Default, //check what it does
            panes: {
                visualizations: {
                    //check what this does
                    visible: false,
                    expanded: false,
                },
                bookmarks: {
                    visible: false,
                },
                fields: {
                    //check
                    visible: false,
                    expanded: false,
                },
                filters: {
                    visible: false,
                },
                pageNavigation: {
                    visible: false,
                },
                selection: {
                    visible: false,
                },
                syncSlicers: {
                    visible: false,
                },
            },
        } as IEmbedSettings;

        return {
            id: embedModel.id,
            embedUrl: embedModel.embedUrl,
            accessToken: embedModel.accessToken,
            type: 'report',
            tokenType: pbi.models.TokenType.Embed,
            permissions: models.Permissions.ReadWrite,
            settings: renderSettings,
            viewMode: editMode ? models.ViewMode.Edit : models.ViewMode.View, //do not use setting mode on the report
        } as IEmbedConfiguration;
    }

    private runEmbedding(
        reportConfiguration: IEmbedConfiguration,
        hostContainer: HTMLDivElement,
        reportName: string,
        showMobileLayout: boolean,
        visuals: [VisualInterface] | null,
        editMode: boolean,
    ): void {
        const report = this.pbiService.embed(hostContainer, reportConfiguration) as pbi.Report;
        report.off('loaded');
        report.on('loaded', () => {
            this.setReport(report);
            this.handleTokenExpiration(report, reportName);
            this.setContainerHeight(report, hostContainer, showMobileLayout);
            if (visuals) this.layoutVisuals(report, hostContainer, visuals, editMode);
        });
        report.off('visualClicked');
        report.on('visualClicked', (event) => {
            console.log('visualClicked', event);
        });
    }

    private handleTokenExpiration(report: pbi.Embed, reportName: string) {
        const timeoutMilliseconds = 55 * 60 * 1000;
        setTimeout(() => {
            this.getReportEmbedModel(reportName)
                .then((apiResponse) => this.getReportEmbedModelFromResponse(apiResponse))
                .then((responseContent) => this.updateEmbedToken(responseContent, report, reportName));
        }, timeoutMilliseconds);
    }

    private updateEmbedToken(embedModel: IReportEmbedModel, report: pbi.Embed, reportName: string): void {
        report.setAccessToken(embedModel.accessToken).then(() => this.handleTokenExpiration(report, reportName));
    }

    private setContainerHeight(report: pbi.Report, hostContainer: HTMLDivElement, showMobileLayout: boolean) {
        report.getPages().then((p: Array<pbi.Page>) => {
            p[0].hasLayout(models.LayoutType.MobilePortrait).then((hasMobileLayout) => {
                if (!hasMobileLayout || !showMobileLayout) {
                    const reportHeight = p[0].defaultSize.height ? p[0].defaultSize.height : 0;
                    const reportWidth = p[0].defaultSize.width ? p[0].defaultSize.width : 1;

                    const ratio = reportHeight / reportWidth;
                    const containerWidth = hostContainer.clientWidth;
                    const newContainerHeight = Math.round(containerWidth * ratio) + 10;

                    hostContainer.style.height = `${newContainerHeight}px`;
                }
            });
        });
        //    report.switchMode('edit').then((res) => console.log(res));    //if use this then cannot hide panels
    }
    public getVisuals(report: pbi.Report | null) {
        return new Promise((resolve) => {
            report?.getPages().then((p: Array<pbi.Page>) => {
                let pageNumber = 0;
                const activePage = p.filter((page, index) => {
                    if (page.isActive) pageNumber = index;
                    return page.isActive;
                })[0];
                // Retrieve active page visuals.
                activePage.getVisuals().then((visuals) => {
                    resolve(
                        visuals.map((el) => ({
                            height: el.layout.height,
                            width: el.layout.width,
                            x: el.layout.x,
                            y: el.layout.y,
                            z: el.layout.z,
                            title: el.title,
                            page: pageNumber,
                        })),
                    );
                });
            });
        });
    }
    private layoutVisuals(
        report: pbi.Report,
        hostContainer: HTMLDivElement,
        visualsData: [VisualInterface] | null,
        editMode: boolean,
    ) {
        report.getPages().then((pages: Array<pbi.Page>) => {
            // Retrieve active page
            const activePage = pages.filter((page) => page.isActive)[0];
            //            jQuery.grep(pages, function (page) { return page.isActive })[0];

            // Set layoutPageName to active page name
            LayoutShowcaseState.layoutPageName = activePage.name;

            // Retrieve active page visuals.
            activePage.getVisuals().then(function (visuals) {
                const reportVisuals = visuals.map(function (visual) {
                    return {
                        name: visual.name,
                        title: visual.title,
                        checked: true,
                    };
                });

                // Create visuals array from the visuals of the active page
                const layoutVisuals = reportVisuals.filter(function (visual) {
                    return visual.title !== undefined;
                });

                let pageHeight = hostContainer.clientHeight;

                let pageWidth = hostContainer.clientWidth;

                const visualsTotalWidth = pageWidth - LayoutShowcaseConsts.margin * (LayoutShowcaseState.columns + 1);

                // Calculate the width of a single visual, according to the number of columns
                // For one and three columns visuals width will be a third of visuals total width
                let width =
                    LayoutShowcaseState.columns === ColumnsNumber.Two ? visualsTotalWidth / 2 : visualsTotalWidth / 3;

                // For one column, set page width to visual's width with margins
                if (LayoutShowcaseState.columns === ColumnsNumber.One) {
                    pageWidth = width + 2 * LayoutShowcaseConsts.margin;

                    // Check if page width is smaller than minimum width and update accordingly
                    if (pageWidth < LayoutShowcaseConsts.minPageWidth) {
                        pageWidth = LayoutShowcaseConsts.minPageWidth;

                        // Visuals width is set to fit minimum page width with margins on both sides
                        width = LayoutShowcaseConsts.minPageWidth - 2 * LayoutShowcaseConsts.margin;
                    }
                }

                // Set visuals height according to width - 9:16 ratio
                const height = width * (9 / 16);
                const checkedVisuals = layoutVisuals.filter(function (visual) {
                    return visual.checked;
                });
                // Calculate the number of lines
                const lines = Math.ceil(checkedVisuals.length / LayoutShowcaseState.columns);

                // Calculate page height with margins
                pageHeight = Math.max(pageHeight, lines * height + (lines + 1) * LayoutShowcaseConsts.margin);

                // Building visualsLayout object
                // You can find more information at https://github.com/Microsoft/PowerBI-JavaScript/wiki/Custom-Layout
                const visualsLayout: { [key: string]: models.IVisualLayout } = {};
                for (let i = 0; i < checkedVisuals.length; i++) {
                    const visual = visualsData?.find((el) => el.title === checkedVisuals[i].title);
                    visualsLayout[checkedVisuals[i].name] = {
                        x: visual?.x,
                        y: visual?.y,
                        width: visual?.width,
                        height: visual?.height,
                        z: visual?.z,
                        displayState: {
                            // Change the selected visuals display mode to visible
                            mode:
                                visual?.visible || editMode
                                    ? models.VisualContainerDisplayMode.Visible
                                    : models.VisualContainerDisplayMode.Hidden,
                        },
                    };
                }
                // Building pagesLayout object
                const pagesLayout: { [key: string]: models.IPageLayout } = {};
                pagesLayout[LayoutShowcaseState.layoutPageName] = {
                    defaultLayout: {
                        displayState: {
                            // Default display mode for visuals is hidden
                            mode: models.VisualContainerDisplayMode.Hidden,
                        },
                    },
                    visualsLayout: visualsLayout,
                };

                // Building settings object
                const settings = {
                    layoutType: models.LayoutType.Custom,
                    customLayout: {
                        pageSize: {
                            type: models.PageSizeType.Custom,
                            width: pageWidth - 10,
                            height: pageHeight - 20,
                        },
                        displayOption: models.DisplayOption.FitToPage,
                        pagesLayout: pagesLayout,
                    },
                    bars: {
                        //top bar save...
                        actionBar: {
                            visible: false,
                        },
                    },
                    background: models.BackgroundType.Default, //check what it does
                    panes: {
                        visualizations: {
                            //check what this does
                            visible: false,
                            expanded: false,
                        },
                        bookmarks: {
                            visible: false,
                        },
                        fields: {
                            //check
                            visible: false,
                            expanded: false,
                        },
                        filters: {
                            visible: false,
                        },
                        pageNavigation: {
                            visible: false,
                        },
                        selection: {
                            visible: false,
                        },
                        syncSlicers: {
                            visible: false,
                        },
                    },
                };

                // Change page background to transparent on Two / Three columns configuration
                // settings.background =
                //     LayoutShowcaseState.columns === ColumnsNumber.One
                //         ? models.BackgroundType.Default
                //         : models.BackgroundType.Transparent;

                // Call updateSettings with the new settings object
                report.updateSettings(settings);
            });
        });
    }
}
