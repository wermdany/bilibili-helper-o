/**
 * Author: DrowsyFlesh
 * Create: 2018/10/28
 * Description:
 */

import {Feature} from 'Libs/feature';
import {__, version} from 'Utils';
import './analytics';

export class GoogleAnalytics extends Feature {
    constructor() {
        super({
            name: 'googleAnalytics',
            kind: 'other',
            settings: {
                on: true,
                //toggle: false,
                title: __('googleAnalytics_name'),
                description: __('googleAnalytics_description'),
            },
        });
    }

    launch = () => {
        this.insertGAScriptTag().then(() => {
            const debugMode = this.getSetting('debug').on;
            this.send({
                hitType: 'event',
                eventCategory: 'initialization',
                eventAction: 'init',
                eventLabel: `${(debugMode ? 'official' : 'dev')} ${version}`,
                nonInteraction: true,
            });
        });
    };

    send = ({hitType, eventAction, eventCategory, eventLabel, nonInteraction}) => {
        window.ga && window.ga('send', {
            hitType,
            eventAction,
            eventCategory,
            eventLabel,
            nonInteraction,
        });
    };

    listener = (message) => {
        /**
         * 需要如下几个字段
         * action 表示操作类型 click init等
         * category 类别 功能名称等
         * label 功能中的具体项目名称等
         * nonInteraction 标记非交互
         */
        if (this.settings.on && message.command === 'setGAEvent' && message.action && message.category) {
            const {action: eventAction, label, category: eventCategory = '', nonInteraction = false} = message;
            this.insertGAScriptTag().then(() => {
                this.send({
                    hitType: 'event',
                    eventAction,
                    eventCategory,
                    eventLabel: label,
                    nonInteraction,
                });
            });
        }
        return true;
    };

    addListener = () => {
        chrome.runtime.onMessage.addListener(this.listener);
    };

    insertGAScriptTag = (UA = 'UA-39765420-2') => {
        return new Promise(resolve => {
            if (document.getElementsByClassName('ga-script').length === 0) {
                this.getStorage('userId')
                    .then(({userId}) => {
                        if (userId) return userId;
                        else {
                            const userId = String(Math.random()).slice(2);
                            return this.setStorage({userId}).then(() => userId);
                        }
                    })
                    .then((userId) => {
                        //const script = `https://www.google-analytics.com/analytics.js`;
                        //const script = `https://www.google-analytics.com/analytics${debug ? '_debug' : ''}.js`;
                        window['GoogleAnalyticsObject'] = 'ga';
                        window.ga = window.ga || function() {
                            (window.ga.q = window.ga.q || []).push(arguments);
                        };
                        window.ga.l = 1 * new Date();
                        window.ga('create', UA, 'auto');
                        window.ga('set', 'checkProtocolTask');
                        window.ga('set', 'dimension1', version);
                        window.ga('set', 'userId', userId);
                        resolve();
                    });
            } else resolve();
        });
    };
};
