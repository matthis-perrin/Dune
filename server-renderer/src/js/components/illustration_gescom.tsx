import React from 'react';

const herissonGescomBase64 =
  'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0icHEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNTAwIDUwMCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNTAwIDUwMDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6I0Q1OTc2MztzdHJva2U6I0Q1OTc2MztzdHJva2Utd2lkdGg6MS43NjMyO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3Qxe2ZpbGw6I0ZDQ0Q4RjtzdHJva2U6I0Q1OTc2MztzdHJva2Utd2lkdGg6MS43NjMyO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3Qye2ZpbGw6IzhCNDczNDtzdHJva2U6I0ZDQ0Q4RjtzdHJva2Utd2lkdGg6My41MjYzO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3Qze2ZpbGw6bm9uZTtzdHJva2U6I0Q1OTc2MztzdHJva2Utd2lkdGg6MS40NzkyO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3Q0e2ZpbGw6bm9uZTtzdHJva2U6I0Q1OTc2MztzdHJva2Utd2lkdGg6MS4xNjQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDV7ZmlsbDpub25lO3N0cm9rZTojRDU5NzYzO3N0cm9rZS13aWR0aDowLjgyNjE7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDZ7ZmlsbDojMDA4RDM2O3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDoxLjc2MzI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDd7ZmlsbDojM0FBQTM1O3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDoxLjc2MzI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDh7ZmlsbDpub25lO3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDoxLjQ3OTI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDl7ZmlsbDpub25lO3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDoxLjE2NDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0MTB7ZmlsbDpub25lO3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDowLjgyNjE7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDExe2ZpbGw6I0MwMDAwMDtzdHJva2U6I0MwMDAwMDtzdHJva2Utd2lkdGg6MS43NjMyO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QxMntmaWxsOiNFQzY0Njc7c3Ryb2tlOiNDMDAwMDA7c3Ryb2tlLXdpZHRoOjEuNzYzMjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0MTN7ZmlsbDpub25lO3N0cm9rZTojQzAwMDAwO3N0cm9rZS13aWR0aDoxLjQ3OTI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDE0e2ZpbGw6bm9uZTtzdHJva2U6I0MwMDAwMDtzdHJva2Utd2lkdGg6MS4xNjQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDE1e2ZpbGw6bm9uZTtzdHJva2U6I0MwMDAwMDtzdHJva2Utd2lkdGg6MC44MjYxO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QxNntmaWxsOiMwMDhEMzY7c3Ryb2tlOiMwMDhEMzY7c3Ryb2tlLXdpZHRoOjAuNzMzNDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0MTd7ZmlsbDojM0FBQTM1O3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDowLjczMzQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDE4e2ZpbGw6IzhCNDczNDtzdHJva2U6I0ZDQ0Q4RjtzdHJva2Utd2lkdGg6MS40NjY5O3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QxOXtmaWxsOm5vbmU7c3Ryb2tlOiMwMDhEMzY7c3Ryb2tlLXdpZHRoOjAuNjE1MztzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0MjB7ZmlsbDpub25lO3N0cm9rZTojMDA4RDM2O3N0cm9rZS13aWR0aDowLjQ4NDI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDIxe2ZpbGw6bm9uZTtzdHJva2U6IzAwOEQzNjtzdHJva2Utd2lkdGg6MC4zNDM2O3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QyMntmaWxsOiNDMDAwMDA7c3Ryb2tlOiNDMDAwMDA7c3Ryb2tlLXdpZHRoOjAuNzMzNDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0MjN7ZmlsbDojRUM2NDY3O3N0cm9rZTojQzAwMDAwO3N0cm9rZS13aWR0aDowLjczMzQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDI0e2ZpbGw6bm9uZTtzdHJva2U6I0MwMDAwMDtzdHJva2Utd2lkdGg6MC42MTUzO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QyNXtmaWxsOm5vbmU7c3Ryb2tlOiNDMDAwMDA7c3Ryb2tlLXdpZHRoOjAuNDg0MjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0MjZ7ZmlsbDpub25lO3N0cm9rZTojQzAwMDAwO3N0cm9rZS13aWR0aDowLjM0MzY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDI3e2ZpbGw6I0Q1OTc2MztzdHJva2U6I0Q1OTc2MztzdHJva2Utd2lkdGg6MC43MzM0O3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QyOHtmaWxsOiNGQ0NEOEY7c3Ryb2tlOiNENTk3NjM7c3Ryb2tlLXdpZHRoOjAuNzMzNDtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQoJLnN0Mjl7ZmlsbDpub25lO3N0cm9rZTojRDU5NzYzO3N0cm9rZS13aWR0aDowLjYxNTM7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQ0KCS5zdDMwe2ZpbGw6bm9uZTtzdHJva2U6I0Q1OTc2MztzdHJva2Utd2lkdGg6MC40ODQyO3N0cm9rZS1taXRlcmxpbWl0OjEwO30NCgkuc3QzMXtmaWxsOm5vbmU7c3Ryb2tlOiNENTk3NjM7c3Ryb2tlLXdpZHRoOjAuMzQzNjtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQo8L3N0eWxlPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTMyNi45LDEzOWwtMTkxLjEtNC4xYy0xMy4zLTAuMy0yNS4xLDQ4LTI2LjQsMTA3LjhjLTEuMyw1OS44LDguNSwxMDguNiwyMS43LDEwOC45bDE5MS4xLDQuMUwzMjYuOSwxMzl6Ii8+DQoJDQoJCTxlbGxpcHNlIHRyYW5zZm9ybT0ibWF0cml4KDIuMTM4NTM0ZS0wMiAtMC45OTk4IDAuOTk5OCAyLjEzODUzNGUtMDIgNzAuMzk4MyA1NjYuNTE3NikiIGNsYXNzPSJzdDEiIGN4PSIzMjQuNiIgY3k9IjI0Ny4zIiByeD0iMTA4LjQiIHJ5PSIyNC4xIi8+DQoJDQoJCTxlbGxpcHNlIHRyYW5zZm9ybT0ibWF0cml4KDIuMTM4NTM0ZS0wMiAtMC45OTk4IDAuOTk5OCAyLjEzODUzNGUtMDIgNjguMDg0OSA1NjkuNzIxNCkiIGNsYXNzPSJzdDIiIGN4PSIzMjUuMSIgY3k9IjI1MC4xIiByeD0iMzkuNyIgcnk9IjcuNiIvPg0KCTxwYXRoIGNsYXNzPSJzdDMiIGQ9Ik0zMTAuNywzMTkuOWMtNC4zLTE3LjQtNi40LTQzLjEtNS44LTcwLjJjMS4xLTQ5LjksMTEuMS05MC43LDIyLjEtOTAuNWMxMS4xLDAuMiwxOS4zLDQxLjUsMTguMiw5MS4zDQoJCWMtMC4zLDEzLjEtMS4yLDI2LTIuNiwzNy44Ii8+DQoJPHBhdGggY2xhc3M9InN0NCIgZD0iTTMxNi4zLDE5NC4xYzMtMTAuMSw2LjctMTUuNiwxMC4zLTE1LjVjOC43LDAuMiwxNS4yLDMyLjYsMTQuMyw3MS45cy04LjcsNzEuNC0xNy40LDcxLjINCgkJYy02LjgtMC4xLTEyLjQtMTkuOC0xNC00OC43Ii8+DQoJPHBhdGggY2xhc3M9InN0NSIgZD0iTTMzNi4zLDI0OS44Yy0wLjcsMjcuNS02LjIsNDkuOC0xMi4zLDQ5LjZjLTYuMi0wLjEtMTAuOC0yMy4yLTEwLjItNTFjMC42LTI3LjgsNi4yLTUwLjcsMTIuNC01MC41DQoJCWMzLjIsMC4xLDYuMiw2LjQsOC4xLDE3LjUiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIGNsYXNzPSJzdDYiIGQ9Ik0zMDEsNi4zTDEwOS44LDIuM0M5Ni41LDIsODQuNyw1MC4yLDgzLjUsMTEwLjFjLTEuMyw1OS44LDguNSwxMDguNiwyMS43LDEwOC45bDE5MS4xLDQuMUwzMDEsNi4zeiIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgyLjEzODUzNGUtMDIgLTAuOTk5OCAwLjk5OTggMi4xMzg1MzRlLTAyIDE3Ny41OTE3IDQxMC44MDE1KSIgY2xhc3M9InN0NyIgY3g9IjI5OC42IiBjeT0iMTE0LjciIHJ4PSIxMDguNCIgcnk9IjI0LjEiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMi4xMzg1MzRlLTAyIC0wLjk5OTggMC45OTk4IDIuMTM4NTM0ZS0wMiAxNzUuMjc4NCA0MTQuMDA1NCkiIGNsYXNzPSJzdDIiIGN4PSIyOTkuMSIgY3k9IjExNy41IiByeD0iMzkuNyIgcnk9IjcuNiIvPg0KCTxwYXRoIGNsYXNzPSJzdDgiIGQ9Ik0yODQuOCwxODcuM2MtNC4zLTE3LjQtNi40LTQzLjEtNS44LTcwLjJjMS4xLTQ5LjksMTEuMS05MC43LDIyLjEtOTAuNWMxMS4xLDAuMiwxOS4zLDQxLjUsMTguMiw5MS4zDQoJCWMtMC4zLDEzLjEtMS4yLDI2LTIuNiwzNy44Ii8+DQoJPHBhdGggY2xhc3M9InN0OSIgZD0iTTI5MC40LDYxLjRjMy0xMC4xLDYuNy0xNS42LDEwLjMtMTUuNWM4LjcsMC4yLDE1LjIsMzIuNiwxNC4zLDcxLjljLTAuOCwzOS4yLTguNyw3MS40LTE3LjQsNzEuMg0KCQljLTYuOC0wLjEtMTIuNC0xOS44LTE0LTQ4LjciLz4NCgk8cGF0aCBjbGFzcz0ic3QxMCIgZD0iTTMxMC40LDExNy4yYy0wLjcsMjcuNS02LjIsNDkuOC0xMi4zLDQ5LjZjLTYuMi0wLjEtMTAuOC0yMy4yLTEwLjItNTFjMC42LTI3LjgsNi4yLTUwLjcsMTIuNC01MC41DQoJCWMzLjIsMC4xLDYuMiw2LjQsOC4xLDE3LjUiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yNzcuMiwyMDIuM2wtMTkxLjEtNC4xYy0xMy4zLTAuMy0yNS4xLDQ4LTI2LjQsMTA3LjhjLTEuMyw1OS44LDguNSwxMDguNiwyMS43LDEwOC45bDE5MS4xLDQuMUwyNzcuMiwyMDIuM3oNCgkJIi8+DQoJDQoJCTxlbGxpcHNlIHRyYW5zZm9ybT0ibWF0cml4KDIuMTM4NTM0ZS0wMiAtMC45OTk4IDAuOTk5OCAyLjEzODUzNGUtMDIgLTQxLjU4MjcgNTc4Ljg1OTMpIiBjbGFzcz0ic3QxIiBjeD0iMjc0LjkiIGN5PSIzMTAuNyIgcng9IjEwOC40IiByeT0iMjQuMSIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgyLjEzODUzNGUtMDIgLTAuOTk5OCAwLjk5OTggMi4xMzg1MzRlLTAyIC00My44OTYgNTgyLjA2MzIpIiBjbGFzcz0ic3QyIiBjeD0iMjc1LjQiIGN5PSIzMTMuNSIgcng9IjM5LjciIHJ5PSI3LjYiLz4NCgk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNMjYxLDM4My4yYy00LjMtMTcuNC02LjQtNDMuMS01LjgtNzAuMmMxLjEtNDkuOSwxMS4xLTkwLjcsMjIuMS05MC41YzExLjEsMC4yLDE5LjMsNDEuNSwxOC4yLDkxLjMNCgkJYy0wLjMsMTMuMS0xLjIsMjYtMi42LDM3LjgiLz4NCgk8cGF0aCBjbGFzcz0ic3Q0IiBkPSJNMjY2LjYsMjU3LjRjMy0xMC4xLDYuNy0xNS42LDEwLjMtMTUuNWM4LjcsMC4yLDE1LjIsMzIuNiwxNC4zLDcxLjljLTAuOCwzOS4yLTguNyw3MS40LTE3LjQsNzEuMg0KCQljLTYuOC0wLjEtMTIuNC0xOS44LTE0LTQ4LjciLz4NCgk8cGF0aCBjbGFzcz0ic3Q1IiBkPSJNMjg2LjcsMzEzLjFjLTAuNywyNy41LTYuMiw0OS44LTEyLjMsNDkuNmMtNi4yLTAuMS0xMC44LTIzLjItMTAuMi01MWMwLjYtMjcuOCw2LjItNTAuNywxMi40LTUwLjUNCgkJYzMuMiwwLjEsNi4yLDYuNCw4LjEsMTcuNSIvPg0KPC9nPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MTEiIGQ9Ik0yMzYuNyw3Mi43TDQ1LjYsNjguNmMtMTMuMy0wLjMtMjUuMSw0OC0yNi40LDEwNy44Yy0xLjMsNTkuOCw4LjUsMTA4LjYsMjEuNywxMDguOWwxOTEuMSw0LjFMMjM2LjcsNzIuN3oiDQoJCS8+DQoJDQoJCTxlbGxpcHNlIHRyYW5zZm9ybT0ibWF0cml4KDIuMTM4NTM0ZS0wMiAtMC45OTk4IDAuOTk5OCAyLjEzODUzNGUtMDIgNDguMzM1IDQxMS41MjgpIiBjbGFzcz0ic3QxMiIgY3g9IjIzNC40IiBjeT0iMTgxLjEiIHJ4PSIxMDguNCIgcnk9IjI0LjEiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMi4xMzg1MzRlLTAyIC0wLjk5OTggMC45OTk4IDIuMTM4NTM0ZS0wMiA0Ni4wMjE2IDQxNC43MzE5KSIgY2xhc3M9InN0MiIgY3g9IjIzNC45IiBjeT0iMTgzLjkiIHJ4PSIzOS43IiByeT0iNy42Ii8+DQoJPHBhdGggY2xhc3M9InN0MTMiIGQ9Ik0yMjAuNSwyNTMuN2MtNC4zLTE3LjQtNi40LTQzLjEtNS44LTcwLjJjMS4xLTQ5LjksMTEuMS05MC43LDIyLjEtOTAuNXMxOS4zLDQxLjUsMTguMiw5MS4zDQoJCWMtMC4zLDEzLjEtMS4yLDI2LTIuNiwzNy44Ii8+DQoJPHBhdGggY2xhc3M9InN0MTQiIGQ9Ik0yMjYuMSwxMjcuOGMzLTEwLjEsNi43LTE1LjYsMTAuMy0xNS41YzguNywwLjIsMTUuMiwzMi42LDE0LjMsNzEuOXMtOC43LDcxLjQtMTcuNCw3MS4yDQoJCWMtNi44LTAuMS0xMi40LTE5LjgtMTQtNDguNyIvPg0KCTxwYXRoIGNsYXNzPSJzdDE1IiBkPSJNMjQ2LjEsMTgzLjVjLTAuNywyNy41LTYuMiw0OS44LTEyLjMsNDkuNmMtNi4yLTAuMS0xMC44LTIzLjItMTAuMi01MWMwLjYtMjcuOCw2LjItNTAuNywxMi40LTUwLjUNCgkJYzMuMiwwLjEsNi4yLDYuNCw4LjEsMTcuNSIvPg0KPC9nPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MCIgZD0iTTIzMS40LDI4MS4ybC0xOTEuMS00LjFjLTEzLjMtMC4zLTI1LjEsNDgtMjYuNCwxMDcuOGMtMS4zLDU5LjgsOC41LDEwOC42LDIxLjcsMTA4LjlsMTkxLjEsNC4xTDIzMS40LDI4MS4yeg0KCQkiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMi4xMzg1MzRlLTAyIC0wLjk5OTggMC45OTk4IDIuMTM4NTM0ZS0wMiAtMTY1LjMzMDIgNjEwLjIzMDcpIiBjbGFzcz0ic3QxIiBjeD0iMjI5IiBjeT0iMzg5LjYiIHJ4PSIxMDguNCIgcnk9IjI0LjEiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMi4xMzg1MzRlLTAyIC0wLjk5OTggMC45OTk4IDIuMTM4NTM0ZS0wMiAtMTY3LjY0MzUgNjEzLjQzNDYpIiBjbGFzcz0ic3QyIiBjeD0iMjI5LjUiIGN5PSIzOTIuNCIgcng9IjM5LjciIHJ5PSI3LjYiLz4NCgk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNMjE1LjIsNDYyLjFjLTQuMy0xNy40LTYuNC00My4xLTUuOC03MC4yYzEuMS00OS45LDExLjEtOTAuNywyMi4xLTkwLjVjMTEuMSwwLjIsMTkuMyw0MS41LDE4LjIsOTEuMw0KCQljLTAuMywxMy4xLTEuMiwyNi0yLjYsMzcuOCIvPg0KCTxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik0yMjAuOCwzMzYuM2MzLTEwLjEsNi43LTE1LjYsMTAuMy0xNS41YzguNywwLjIsMTUuMiwzMi42LDE0LjMsNzEuOWMtMC44LDM5LjItOC43LDcxLjQtMTcuNCw3MS4yDQoJCWMtNi44LTAuMS0xMi40LTE5LjgtMTQtNDguNyIvPg0KCTxwYXRoIGNsYXNzPSJzdDUiIGQ9Ik0yNDAuOCwzOTJjLTAuNywyNy41LTYuMiw0OS44LTEyLjMsNDkuNmMtNi4yLTAuMS0xMC44LTIzLjItMTAuMi01MWMwLjYtMjcuOCw2LjItNTAuNywxMi40LTUwLjUNCgkJYzMuMiwwLjEsNi4yLDYuNCw4LjEsMTcuNSIvPg0KPC9nPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MTYiIGQ9Ik0zODQuMSwzNjYuNWwxLjMsNzkuNWMwLjEsNS41LDIwLjMsOS43LDQ1LjIsOS4yYzI0LjktMC40LDQ1LTUuMiw0NC45LTEwLjhsLTEuMy03OS41TDM4NC4xLDM2Ni41eiIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5OTkgLTEuNjkyMzQxZS0wMiAxLjY5MjM0MWUtMDIgMC45OTk5IC02LjEyODMgNy4zMTUxKSIgY2xhc3M9InN0MTciIGN4PSI0MjkuMiIgY3k9IjM2NS44IiByeD0iNDUuMSIgcnk9IjEwIi8+DQoJDQoJCTxlbGxpcHNlIHRyYW5zZm9ybT0ibWF0cml4KDAuOTk5OSAtMS42OTIzNDFlLTAyIDEuNjkyMzQxZS0wMiAwLjk5OTkgLTYuMTI0IDcuMzM0NSkiIGNsYXNzPSJzdDE4IiBjeD0iNDMwLjMiIGN5PSIzNjUuNSIgcng9IjE2LjUiIHJ5PSIzLjEiLz4NCgk8cGF0aCBjbGFzcz0ic3QxOSIgZD0iTTQ1OS41LDM3MC40Yy03LjEsMi4xLTE3LjgsMy40LTI5LjEsMy41Yy0yMC43LDAuNC0zNy45LTMuMS0zOC03LjhzMTYuOS04LjcsMzcuNy05DQoJCWM1LjQtMC4xLDEwLjgsMC4xLDE1LjgsMC41Ii8+DQoJPHBhdGggY2xhc3M9InN0MjAiIGQ9Ik00MDcuMiwzNzBjLTQuMi0xLjEtNi42LTIuNS02LjYtNGMtMC4xLTMuNiwxMy4zLTYuOCwyOS42LTcuMXMyOS44LDIuNSwyOS45LDYuMWMwLDIuOC04LDUuNS0yMCw2LjYiLz4NCgk8cGF0aCBjbGFzcz0ic3QyMSIgZD0iTTQzMCwzNjAuOGMxMS40LTAuMSwyMC44LDEuOCwyMC44LDQuM2MwLDIuNi05LjUsNC44LTIxLDVjLTExLjYsMC4yLTIxLjItMS44LTIxLjItNC4zDQoJCWMwLTEuMywyLjYtMi43LDcuMS0zLjYiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIGNsYXNzPSJzdDIyIiBkPSJNMzE0LjcsMzg4LjlsMS4zLDc5LjVjMC4xLDUuNSwyMC4zLDkuNyw0NS4yLDkuMmMyNC45LTAuNCw0NS01LjIsNDQuOS0xMC44bC0xLjMtNzkuNUwzMTQuNywzODguOXoiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMC45OTk5IC0xLjY5MjM0MWUtMDIgMS42OTIzNDFlLTAyIDAuOTk5OSAtNi41MTcxIDYuMTQzNSkiIGNsYXNzPSJzdDIzIiBjeD0iMzU5LjciIGN5PSIzODguMSIgcng9IjQ1LjEiIHJ5PSIxMCIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5OTkgLTEuNjkyMzQxZS0wMiAxLjY5MjM0MWUtMDIgMC45OTk5IC02LjUxMjggNi4xNjI5KSIgY2xhc3M9InN0MTgiIGN4PSIzNjAuOSIgY3k9IjM4Ny45IiByeD0iMTYuNSIgcnk9IjMuMSIvPg0KCTxwYXRoIGNsYXNzPSJzdDI0IiBkPSJNMzkwLjEsMzkyLjdjLTcuMSwyLjEtMTcuOCwzLjQtMjkuMSwzLjVjLTIwLjcsMC40LTM3LjktMy4xLTM4LTcuOHMxNi45LTguNywzNy43LTkNCgkJYzUuNC0wLjEsMTAuOCwwLjEsMTUuOCwwLjUiLz4NCgk8cGF0aCBjbGFzcz0ic3QyNSIgZD0iTTMzNy43LDM5Mi40Yy00LjItMS4xLTYuNi0yLjUtNi42LTRjLTAuMS0zLjYsMTMuMy02LjgsMjkuNi03LjFjMTYuMy0wLjMsMjkuOCwyLjUsMjkuOSw2LjENCgkJYzAsMi44LTgsNS41LTIwLDYuNiIvPg0KCTxwYXRoIGNsYXNzPSJzdDI2IiBkPSJNMzYwLjYsMzgzLjJjMTEuNC0wLjEsMjAuOCwxLjgsMjAuOCw0LjNjMCwyLjYtOS41LDQuOC0yMSw1Yy0xMS42LDAuMi0yMS4yLTEuOC0yMS4yLTQuMw0KCQljMC0xLjMsMi42LTIuNyw3LjEtMy42Ii8+DQo8L2c+DQo8Zz4NCgk8cGF0aCBjbGFzcz0ic3QxNiIgZD0iTTM4NC42LDI4NS4xbDEuMyw3OS41YzAuMSw1LjUsMjAuMyw5LjcsNDUuMiw5LjJjMjQuOS0wLjQsNDUtNS4yLDQ0LjktMTAuOGwtMS4zLTc5LjVMMzg0LjYsMjg1LjF6Ii8+DQoJDQoJCTxlbGxpcHNlIHRyYW5zZm9ybT0ibWF0cml4KDAuOTk5OSAtMS42OTIzNDFlLTAyIDEuNjkyMzQxZS0wMiAwLjk5OTkgLTQuNzUxMSA3LjMxMTUpIiBjbGFzcz0ic3QxNyIgY3g9IjQyOS42IiBjeT0iMjg0LjQiIHJ4PSI0NS4xIiByeT0iMTAiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMC45OTk5IC0xLjY5MjM0MWUtMDIgMS42OTIzNDFlLTAyIDAuOTk5OSAtNC43NDY4IDcuMzMwOSkiIGNsYXNzPSJzdDE4IiBjeD0iNDMwLjgiIGN5PSIyODQuMSIgcng9IjE2LjUiIHJ5PSIzLjEiLz4NCgk8cGF0aCBjbGFzcz0ic3QxOSIgZD0iTTQ2MCwyODljLTcuMSwyLjEtMTcuOCwzLjQtMjkuMSwzLjVjLTIwLjcsMC40LTM3LjktMy4xLTM4LTcuOHMxNi45LTguNywzNy43LTljNS40LTAuMSwxMC44LDAuMSwxNS44LDAuNSINCgkJLz4NCgk8cGF0aCBjbGFzcz0ic3QyMCIgZD0iTTQwNy42LDI4OC43Yy00LjItMS4xLTYuNi0yLjUtNi42LTRjLTAuMS0zLjYsMTMuMy02LjgsMjkuNi03LjFzMjkuOCwyLjUsMjkuOSw2LjFjMCwyLjgtOCw1LjUtMjAsNi42Ii8+DQoJPHBhdGggY2xhc3M9InN0MjEiIGQ9Ik00MzAuNSwyNzkuNWMxMS40LTAuMSwyMC44LDEuOCwyMC44LDQuM2MwLDIuNi05LjUsNC44LTIxLDVjLTExLjYsMC4yLTIxLjItMS44LTIxLjItNC4zDQoJCWMwLTEuMywyLjYtMi43LDcuMS0zLjYiLz4NCjwvZz4NCjxnPg0KCTxwYXRoIGNsYXNzPSJzdDE2IiBkPSJNMzgwLjMsMjAzLjZsMS4zLDc5LjVjMC4xLDUuNSwyMC4zLDkuNyw0NS4yLDkuMmMyNC45LTAuNCw0NS01LjIsNDQuOS0xMC44bC0xLjMtNzkuNUwzODAuMywyMDMuNnoiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMC45OTk5IC0xLjY5MjM0MWUtMDIgMS42OTIzNDFlLTAyIDAuOTk5OSAtMy4zNzE2IDcuMjI3MykiIGNsYXNzPSJzdDE3IiBjeD0iNDI1LjMiIGN5PSIyMDIuOCIgcng9IjQ1LjEiIHJ5PSIxMCIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5OTkgLTEuNjkyMzQxZS0wMiAxLjY5MjM0MWUtMDIgMC45OTk5IC0zLjM2NzMgNy4yNDY3KSIgY2xhc3M9InN0MTgiIGN4PSI0MjYuNSIgY3k9IjIwMi42IiByeD0iMTYuNSIgcnk9IjMuMSIvPg0KCTxwYXRoIGNsYXNzPSJzdDE5IiBkPSJNNDU1LjcsMjA3LjRjLTcuMSwyLjEtMTcuOCwzLjQtMjkuMSwzLjVjLTIwLjcsMC40LTM3LjktMy4xLTM4LTcuOHMxNi45LTguNywzNy43LTkNCgkJYzUuNC0wLjEsMTAuOCwwLjEsMTUuOCwwLjUiLz4NCgk8cGF0aCBjbGFzcz0ic3QyMCIgZD0iTTQwMy4zLDIwNy4xYy00LjItMS4xLTYuNi0yLjUtNi42LTRjLTAuMS0zLjYsMTMuMy02LjgsMjkuNi03LjFjMTYuMy0wLjMsMjkuOCwyLjUsMjkuOSw2LjENCgkJYzAsMi44LTgsNS41LTIwLDYuNiIvPg0KCTxwYXRoIGNsYXNzPSJzdDIxIiBkPSJNNDI2LjIsMTk3LjljMTEuNC0wLjEsMjAuOCwxLjgsMjAuOCw0LjNjMCwyLjYtOS41LDQuOC0yMSw1Yy0xMS42LDAuMi0yMS4yLTEuOC0yMS4yLTQuMw0KCQljMC0xLjMsMi42LTIuNyw3LjEtMy42Ii8+DQo8L2c+DQo8Zz4NCgk8cGF0aCBjbGFzcz0ic3QyMiIgZD0iTTMxMy4yLDMwNWwxLjMsNzkuNWMwLjEsNS41LDIwLjMsOS43LDQ1LjIsOS4yYzI0LjktMC40LDQ1LTUuMiw0NC45LTEwLjhsLTEuMy03OS41TDMxMy4yLDMwNXoiLz4NCgkNCgkJPGVsbGlwc2UgdHJhbnNmb3JtPSJtYXRyaXgoMC45OTk5IC0xLjY5MjM0MWUtMDIgMS42OTIzNDFlLTAyIDAuOTk5OSAtNS4wOTc3IDYuMTA3NCkiIGNsYXNzPSJzdDIzIiBjeD0iMzU4LjMiIGN5PSIzMDQuMyIgcng9IjQ1LjEiIHJ5PSIxMCIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5OTkgLTEuNjkyMzQxZS0wMiAxLjY5MjM0MWUtMDIgMC45OTk5IC01LjA5MzQgNi4xMjY5KSIgY2xhc3M9InN0MTgiIGN4PSIzNTkuNSIgY3k9IjMwNCIgcng9IjE2LjUiIHJ5PSIzLjEiLz4NCgk8cGF0aCBjbGFzcz0ic3QyNCIgZD0iTTM4OC43LDMwOC45Yy03LjEsMi4xLTE3LjgsMy40LTI5LjEsMy41Yy0yMC43LDAuNC0zNy45LTMuMS0zOC03LjhzMTYuOS04LjcsMzcuNy05DQoJCWM1LjQtMC4xLDEwLjgsMC4xLDE1LjgsMC41Ii8+DQoJPHBhdGggY2xhc3M9InN0MjUiIGQ9Ik0zMzYuMywzMDguNWMtNC4yLTEuMS02LjYtMi41LTYuNi00Yy0wLjEtMy42LDEzLjMtNi44LDI5LjYtNy4xYzE2LjMtMC4zLDI5LjgsMi41LDI5LjksNi4xDQoJCWMwLDIuOC04LDUuNS0yMCw2LjYiLz4NCgk8cGF0aCBjbGFzcz0ic3QyNiIgZD0iTTM1OS4yLDI5OS4zYzExLjQtMC4xLDIwLjgsMS44LDIwLjgsNC4zYzAsMi42LTkuNSw0LjgtMjEsNWMtMTEuNiwwLjItMjEuMi0xLjgtMjEuMi00LjMNCgkJYzAtMS4zLDIuNi0yLjcsNy4xLTMuNiIvPg0KPC9nPg0KPGc+DQoJPHBhdGggY2xhc3M9InN0MjciIGQ9Ik0zOTcuNSwzOTguN2wxLjMsNzkuNWMwLjEsNS41LDIwLjMsOS43LDQ1LjIsOS4yYzI0LjktMC40LDQ1LTUuMiw0NC45LTEwLjhsLTEuMy03OS41TDM5Ny41LDM5OC43eiIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5OTkgLTEuNjkyMzQxZS0wMiAxLjY5MjM0MWUtMDIgMC45OTk5IC02LjY3MSA3LjU0NikiIGNsYXNzPSJzdDI4IiBjeD0iNDQyLjUiIGN5PSIzOTcuOSIgcng9IjQ1LjEiIHJ5PSIxMCIvPg0KCQ0KCQk8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjk5OTkgLTEuNjkyMzQxZS0wMiAxLjY5MjM0MWUtMDIgMC45OTk5IC02LjY2NjcgNy41NjU0KSIgY2xhc3M9InN0MTgiIGN4PSI0NDMuNyIgY3k9IjM5Ny43IiByeD0iMTYuNSIgcnk9IjMuMSIvPg0KCTxwYXRoIGNsYXNzPSJzdDI5IiBkPSJNNDcyLjksNDAyLjVjLTcuMSwyLjEtMTcuOCwzLjQtMjkuMSwzLjVjLTIwLjcsMC40LTM3LjktMy4xLTM4LTcuOHMxNi45LTguNywzNy43LTkNCgkJYzUuNC0wLjEsMTAuOCwwLjEsMTUuOCwwLjUiLz4NCgk8cGF0aCBjbGFzcz0ic3QzMCIgZD0iTTQyMC41LDQwMi4yYy00LjItMS4xLTYuNi0yLjUtNi42LTRjLTAuMS0zLjYsMTMuMy02LjgsMjkuNi03LjFjMTYuMy0wLjMsMjkuOCwyLjUsMjkuOSw2LjENCgkJYzAsMi44LTgsNS41LTIwLDYuNiIvPg0KCTxwYXRoIGNsYXNzPSJzdDMxIiBkPSJNNDQzLjQsMzkzYzExLjQtMC4xLDIwLjgsMS44LDIwLjgsNC4zYzAsMi42LTkuNSw0LjgtMjEsNWMtMTEuNiwwLjItMjEuMi0xLjgtMjEuMi00LjMNCgkJYzAtMS4zLDIuNi0yLjcsNy4xLTMuNiIvPg0KPC9nPg0KPC9zdmc+DQo=';

export class IllustrationGescom extends React.Component<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  {}
> {
  public static displayName = 'Illusatation_Gescom';

  public render(): JSX.Element {
    return <img {...this.props} src={herissonGescomBase64} />;
  }
}
