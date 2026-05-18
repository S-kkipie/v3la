import {
    ansiColorFormatter,
    configure,
    getConsoleSink,
    withFilter,
} from "@logtape/logtape";

const isDev = process.env.NODE_ENV === "development";

await configure({
    sinks: {
        console: withFilter(
            getConsoleSink({
                formatter: ansiColorFormatter,
            }),
            isDev ? "debug" : "info",
        ),
    },
    loggers: [
        {
            category: ["logtape", "meta"],
            sinks: ["console"],
            lowestLevel: "error",
        },

        {
            category: ["stocky", "frontend"],
            lowestLevel: "debug",
            sinks: ["console"],
        },
    ],
});
