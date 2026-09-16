import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="InsightPilot AI",
    page_icon="📊",
    layout="wide"
)

st.title("📊 InsightPilot AI")
st.subheader("Intelligent Decision Support System")

st.sidebar.header("Dashboard Menu")

menu = st.sidebar.selectbox(
    "Select Option",
    ["Overview", "Data Analysis", "Visualizations", "Insights"]
)

# Dataset Upload
st.sidebar.header("Upload Dataset")

uploaded_file = st.sidebar.file_uploader(
    "Upload CSV file",
    type=["csv"]
)

df = None

if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)

# Overview
if menu == "Overview":

    st.header("Business Analytics Dashboard")

    if df is not None:

        col1, col2, col3 = st.columns(3)

        col1.metric("Total Records", len(df))
        col2.metric("Total Features", len(df.columns))
        col3.metric("Missing Values", int(df.isnull().sum().sum()))

        st.subheader("Dataset Preview")
        st.dataframe(df.head(10), use_container_width=True)

    else:
        st.info("Please upload a CSV dataset from the sidebar.")

# Data Analysis
elif menu == "Data Analysis":

    st.header("Data Analysis")

    if df is not None:

        st.subheader("Dataset Information")

        col1, col2 = st.columns(2)

        with col1:
            st.write("Number of Rows:", df.shape[0])
            st.write("Number of Columns:", df.shape[1])

        with col2:
            st.write("Duplicate Rows:", df.duplicated().sum())
            st.write("Missing Values:", df.isnull().sum().sum())

        st.subheader("Statistical Summary")
        st.dataframe(df.describe(include="all"), use_container_width=True)

    else:
        st.warning("Please upload a CSV dataset first.")

# Visualizations
elif menu == "Visualizations":

    st.header("Visualizations")

    if df is not None:

        numeric_columns = df.select_dtypes(
            include="number"
        ).columns.tolist()

        if numeric_columns:
            selected_column = st.selectbox(
                "Select a numeric column",
                numeric_columns
            )

            st.bar_chart(df[selected_column])

        else:
            st.info("No numeric columns found in the dataset.")

    else:
        st.warning("Please upload a CSV dataset first.")

# Explainable AI Insights
elif menu == "Insights":

    st.header("Explainable AI Insights")

    st.info(
        "Machine Learning model explanations and important "
        "features will be displayed here."
    )
