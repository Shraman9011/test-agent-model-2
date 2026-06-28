import django.core.validators
import django.db.models.deletion
from decimal import Decimal

import django.db.models.functions
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------ #
        # LeaveType                                                            #
        # ------------------------------------------------------------------ #
        migrations.CreateModel(
            name='LeaveType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('max_days_per_year', models.PositiveIntegerField(
                    help_text='Maximum leave days of this type allowed per employee per year.',
                    validators=[django.core.validators.MinValueValidator(1)],
                )),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Leave Type',
                'verbose_name_plural': 'Leave Types',
                'db_table': 'leaves_leavetype',
                'ordering': ['name'],
            },
        ),

        # ------------------------------------------------------------------ #
        # LeaveRequest                                                         #
        # ------------------------------------------------------------------ #
        migrations.CreateModel(
            name='LeaveRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('employee', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='leave_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('leave_type', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='requests',
                    to='leaves.leavetype',
                )),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('total_days', models.PositiveIntegerField(
                    validators=[django.core.validators.MinValueValidator(1)],
                )),
                ('reason', models.TextField()),
                ('status', models.CharField(
                    choices=[
                        ('PENDING', 'Pending'),
                        ('APPROVED', 'Approved'),
                        ('REJECTED', 'Rejected'),
                        ('CANCELLED', 'Cancelled'),
                    ],
                    db_index=True,
                    default='PENDING',
                    max_length=20,
                )),
                ('applied_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reviewed_leaves',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('review_note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'leaves_leaverequest',
                'ordering': ['-applied_at'],
            },
        ),

        migrations.AddIndex(
            model_name='leaverequest',
            index=models.Index(fields=['employee', 'status'], name='idx_leavereq_emp_status'),
        ),
        migrations.AddIndex(
            model_name='leaverequest',
            index=models.Index(fields=['start_date', 'end_date'], name='idx_leavereq_dates'),
        ),
        migrations.AddConstraint(
            model_name='leaverequest',
            constraint=models.CheckConstraint(
                check=models.Q(end_date__gte=models.F('start_date')),
                name='chk_leavereq_end_gte_start',
            ),
        ),
        migrations.AddConstraint(
            model_name='leaverequest',
            constraint=models.CheckConstraint(
                check=models.Q(total_days__gte=1),
                name='chk_leavereq_total_days_positive',
            ),
        ),

        # ------------------------------------------------------------------ #
        # LeaveBalance                                                         #
        # ------------------------------------------------------------------ #
        migrations.CreateModel(
            name='LeaveBalance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('employee', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='leave_balances',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('leave_type', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='balances',
                    to='leaves.leavetype',
                )),
                ('year', models.PositiveIntegerField(
                    help_text='Calendar year this balance applies to.',
                    validators=[django.core.validators.MinValueValidator(2000)],
                )),
                ('allocated_days', models.DecimalField(
                    decimal_places=1,
                    max_digits=5,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.0'))],
                )),
                ('used_days', models.DecimalField(
                    decimal_places=1,
                    default=Decimal('0.0'),
                    max_digits=5,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.0'))],
                )),
                ('pending_days', models.DecimalField(
                    decimal_places=1,
                    default=Decimal('0.0'),
                    max_digits=5,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.0'))],
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'leaves_leavebalance',
            },
        ),

        migrations.AlterUniqueTogether(
            name='leavebalance',
            unique_together={('employee', 'leave_type', 'year')},
        ),
        migrations.AddIndex(
            model_name='leavebalance',
            index=models.Index(fields=['employee', 'year'], name='idx_leavebal_emp_year'),
        ),
        migrations.AddConstraint(
            model_name='leavebalance',
            constraint=models.CheckConstraint(
                check=models.Q(allocated_days__gte=0),
                name='chk_leavebal_allocated_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='leavebalance',
            constraint=models.CheckConstraint(
                check=models.Q(used_days__gte=0),
                name='chk_leavebal_used_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='leavebalance',
            constraint=models.CheckConstraint(
                check=models.Q(pending_days__gte=0),
                name='chk_leavebal_pending_non_negative',
            ),
        ),
    ]
