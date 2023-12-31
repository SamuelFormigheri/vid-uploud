import { JSX } from "solid-js/jsx-runtime";

function IconPlay(props: JSX.SvgSVGAttributes<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-line-cap="round"
            stroke-line-join="round"
            stroke-width="2"
            class="feather feather-youtube"
            viewBox="0 0 24 24"
            {...props}
        >
            <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"></path>
            <path d="M9.75 15.02L15.5 11.75 9.75 8.48 9.75 15.02z"></path>
        </svg>
    );
}

export default IconPlay;