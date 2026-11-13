library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity harness is
    port (
    left_signal : in std_logic;
    right_signal : in std_logic;
    enable : in std_logic;
    lamp_a : out std_logic;
    lamp_b : out std_logic
    );
end entity;
architecture rtl of harness is
    begin
    lamp_a <= enable and left_signal;
    lamp_b <= enable and left_signal;
end architecture;
