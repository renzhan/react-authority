import React, {Fragment, PureComponent} from 'react';
import {connect} from 'dva';
import {Badge, Button, Card, Col, Divider, Form, Input, Modal, Row, Select,} from 'antd';
import StandardTable from '../../components/StandardTable';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import RoleSelectTree from '../../components/Role/RoleSelectTree';
import AdminForm from '../../components/Admin/AdminForm';

import styles from '../TableList.less';

const FormItem = Form.Item;
const { Option } = Select;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');
const statusMap = ['default', 'success'];
const status = ['不可用', '可用'];


@connect(({ role,admin,loading }) => ({
  role,
  admin,
  loading: loading.models.admin,
}))
@Form.create()
export default class RoleAllocation extends PureComponent {
  state = {
    roleModalVisible: false,
    selectedRows: [],
    // 搜索条件字段
    searchFields: {
      search: '',
      status:'',
    },
    userId:null,
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'admin/list',
      payload:{}
    });
  }

  refush =()=>{
    const {dispatch} = this.props;
    dispatch({
      type: 'admin/list',
      payload:{}
    });
  };

  handleStandardTableChange = (pagination, filtersArg, sorter) => {

    const {dispatch} = this.props;
    dispatch({
      type: 'admin/list',
      payload: {
        ...this.state.searchFields,
        current: pagination.current,
      },
    });
  };

  /**
   * 搜索
   * @param e
   */
  handleSearch = e => {
    e.preventDefault();

    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      this.setState({
        searchFields: fieldsValue,
        current: 1,
      });
      dispatch({
        type: 'admin/list',
        payload: fieldsValue,
      });
    });
  };


  /**
   * 搜索条件清空 handler
   */
  handleSearchFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      searchFields: {
        search: '',
      },
    });

    dispatch({
      type: 'admin/list',
      payload:{}
    });
  };


  /**
   * 显示编辑信息弹窗
   * @param record
   */
  showModalAdminForm = (record) => {
    const {dispatch} = this.props;
    dispatch({
      type: 'admin/openEdit',
      payload: record,
    });
  };


  /**
   * 提交 添加的admin
   * @param e
   */
  handleSubmitAdmin = values => {
    const {dispatch,admin:{adminItem}} = this.props;
    values['id']=adminItem.id||null;
    dispatch({
      type: 'admin/saveOrUpdate',
      payload: values,
    }).then(()=>{
      this.refush();
    });
  };


  closeModal = (type) => {
    const {dispatch} = this.props;
    dispatch({
      type: 'admin/closeModal',
      payload: {modalType: type},
    });
  };


  showDeleteConfirm=(record)=> {

    const confirm = Modal.confirm;

    let self =this;
    confirm({
      title: '你确定删除选中的数据?',
      content: '',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        self.handleDelete(record);
      },
      onCancel() {
      },
    });
  };


  handleDelete = (record) => {
    const {dispatch} = this.props;
    if (!record) return;

    dispatch({
      type: 'admin/delete',
      payload: {
        ids: [record.id],
      },
    }).then(()=>{
      this.refush();
    });

  };

  handleSelectRows = rows => {
    this.setState({
      selectedRows: rows,
    });
  };


  /**
   *  角色选择提交
   */
  roleSelectSubmitHandle = values=>{


    console.log('formvalue', values);

    this.props.dispatch({
      type: 'role/updateUserRoles',
      payload: {
        userId:this.state.userId,
        roleIds:values.map(item=>{
          return parseInt(item);
        })
      },
    });

  };

  roleSelectHidenModal =()=>{

    this.setState({
      roleModalVisible:false
    });
  };


  roleSelectShowModal =(record)=>{

    /**
     * 请求数据
     */
    this.props.dispatch({
      type: 'role/querySingleUserRole',
      payload:record.id
    });

    this.setState({
      roleModalVisible:true,
      userId:record.id
    });
  };

  renderSimpleForm() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="用户名">
              {getFieldDecorator('search')(<Input placeholder="请输入" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleSearchFormReset}>
                重置
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    const {role:{ userRoles },admin:{adminPageData,adminFormModalVisible,adminItem,adminFormOption},loading ,} = this.props;

    const { selectedRows } = this.state;
    const columns = [
      /*{
        title: '主键',
        dataIndex: 'id',
      },*/
      {
        title: '用户名称',
        dataIndex: 'username',
      },
      {
        title: '用户昵称',
        dataIndex: 'nickname',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
      },
      {
        title: '手机号',
        dataIndex: 'telephone',
      },
      {
        title: '用户状态',
        dataIndex: 'status',
        filters: [
          {
            text: status[0],
            value: 0,
          },
          {
            text: status[1],
            value: 1,
          }
        ],
        onFilter: (value, record) => record.status.toString() === value,
        render(val) {
          return <Badge status={statusMap[val]} text={status[val]} />;
        },
      },
      {
        title: '操作',
        render: (record) => (
          <Fragment>
            <a onClick={() => this.showModalAdminForm(record)}>编辑</a>
            <Divider type="vertical"/>
            <a onClick={() => this.showDeleteConfirm(record)}>删除</a>
            <Divider type="vertical"/>
            <a onClick={()=>this.roleSelectShowModal(record)}>分配角色</a>

          </Fragment>
        ),
      },
    ];


    return (
      <PageHeaderLayout title="系统用户列表">
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderSimpleForm()}</div>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.showModalAdminForm([])}>
                新建
              </Button>
            </div>
            <StandardTable
              selectedRows={selectedRows}
              hiddenCheck={true}
              loading={loading}
              data={adminPageData}
              rowKey="id"
              columns={columns}
              onSelectRow={this.handleSelectRows}
              onChange={this.handleStandardTableChange}
            />
          </div>
        </Card>

        <AdminForm title={`${adminFormOption}管理员`} record={adminItem} modalVisible={adminFormModalVisible}
                  handleSubmit={this.handleSubmitAdmin}
                  handleCloseModal={(p) => this.closeModal('admin')}/>

        <RoleSelectTree
          modalVisible={this.state.roleModalVisible}
          treeData={userRoles}
          handleSubmit={this.roleSelectSubmitHandle}
          handleCloseModal={this.roleSelectHidenModal}
        />
      </PageHeaderLayout>
    );
  }
}
